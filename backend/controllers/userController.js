import User from '../models/User.js';
import { generateTokens } from '../utils/generateToken.js';
import { sendEmail } from '../utils/sendEmail.js';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import crypto from 'crypto';

// Zod schemas for validation
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// @desc    Auth user & get token
// @route   POST /api/users/auth
// @access  Public
export const authUser = async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      // ... existing code ...
      const { accessToken, refreshToken } = generateTokens(res, user._id);
      
      // Store refresh token in user document (ensure array exists)
      if (!user.refreshTokens) user.refreshTokens = [];
      user.refreshTokens.push(refreshToken);
      await user.save();

      console.log(`[LOG] User logged in: ${user.email}`);

      res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      });
    } else {
      console.log(`[LOG] Login failed for email: ${email}. User found: ${!!user}`);
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(`[ERROR] Auth error: ${error && error.message ? error.message : JSON.stringify(error)}`);
    const msg = (error && error.errors && error.errors[0] && error.errors[0].message) || (error && error.message) || 'Authentication failed';
    res.status(400).json({ message: msg });
  }
};

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = registerSchema.parse(req.body);

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(20).toString('hex');

    const user = await User.create({
      name,
      email,
      password,
      verificationToken,
      verificationTokenExpire: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    if (user) {
      // Send verification email
      const verifyUrl = `${req.protocol}://${req.get('host')}/api/users/verify-email?token=${verificationToken}`;
      console.log(`[DEV ONLY] Verification Link: ${verifyUrl}`);
      
      await sendEmail({
        email: user.email,
        subject: 'DermAI - Email Verification',
        html: `<h2>Welcome to DermAI</h2><p>Please click <a href="${verifyUrl}">here</a> to verify your email.</p><p>Or copy this link: ${verifyUrl}</p>`,
      });

      console.log(`[LOG] User registered: ${user.email}. Verification email sent.`);

      // We don't log them in automatically in strict prod until verified, but for usability we can issue tokens
      const { accessToken, refreshToken } = generateTokens(res, user._id);
      if (!user.refreshTokens) user.refreshTokens = [];
      user.refreshTokens.push(refreshToken);
      await user.save();

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        message: 'Registration successful. Please check your email to verify your account.'
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    const msg = (error && error.errors && error.errors[0] && error.errors[0].message) || (error && error.message) || 'Registration failed';
    res.status(400).json({ message: msg });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/users/logout
// @access  Public
export const logoutUser = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (req.user && refreshToken) {
    // Remove specific refresh token from db
    req.user.refreshTokens = req.user.refreshTokens.filter(rt => rt !== refreshToken);
    await req.user.save();
  }

  res.cookie('jwt', '', { httpOnly: true, expires: new Date(0) });
  res.cookie('refreshToken', '', { httpOnly: true, expires: new Date(0) });
  
  console.log(`[LOG] User logged out.`);
  res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Refresh token
// @route   POST /api/users/refresh
// @access  Public
export const refreshToken = async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken;

  if (!incomingRefreshToken) {
    return res.status(401).json({ message: 'Not authorized, no refresh token' });
  }

  try {
    const decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.refreshTokens.includes(incomingRefreshToken)) {
      // Possible reuse of old token / security breach detected
      if (user) {
        user.refreshTokens = []; // Revoke all tokens
        await user.save();
      }
      return res.status(401).json({ message: 'Invalid refresh token, login again' });
    }

    // Token rotation: Issue new tokens, remove old
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(res, user._id);
    user.refreshTokens = user.refreshTokens.filter(rt => rt !== incomingRefreshToken);
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    res.status(200).json({ accessToken });
  } catch (error) {
    res.status(401).json({ message: 'Refresh token expired or invalid' });
  }
};

// @desc    Verify email
// @route   GET /api/users/verify-email
// @access  Public
export const verifyEmail = async (req, res) => {
  const { token } = req.query;

  const user = await User.findOne({
    verificationToken: token,
    verificationTokenExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired verification token' });
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpire = undefined;
  await user.save();

  // Redirect to frontend login/dashboard
  res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:8080'}/auth?verified=true`);
}

// @desc    Forgot password
// @route   POST /api/users/forgotpassword
// @access  Public
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes

  await user.save();

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset-password?token=${resetToken}`;
  
  await sendEmail({
    email: user.email,
    subject: 'DermAI - Password Reset',
    html: `<h2>Password Reset Request</h2><p>Click <a href="${resetUrl}">here</a> to reset your password.</p><p>This link expires in 15 minutes.</p>`,
  });

  console.log(`[LOG] Password reset requested for: ${user.email}`);

  res.status(200).json({ message: 'Password reset email sent' });
};

// @desc    Reset password
// @route   PUT /api/users/resetpassword/:token
// @access  Public
export const resetPassword = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }

  user.password = req.body.password; // Pre-save hook hashes it
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.refreshTokens = []; // Log them out of all devices for security
  await user.save();

  console.log(`[LOG] Password reset successfully for: ${user.email}`);

  res.status(200).json({ message: 'Password reset successful. Please log in.' });
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isVerified: updatedUser.isVerified
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};
