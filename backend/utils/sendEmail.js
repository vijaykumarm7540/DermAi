import nodemailer from 'nodemailer';

export const sendEmail = async (options) => {
  // Create a transporter. Using ethereal for development if no real SMTP provided
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: process.env.SMTP_PORT || 587,
    auth: {
      user: process.env.SMTP_USER || 'ethereal.user@ethereal.email', // Replace with real in production
      pass: process.env.SMTP_PASS || 'ethereal_password',
    },
  });

  const message = {
    from: `${process.env.FROM_NAME || 'DermAI'} <${process.env.FROM_EMAIL || 'noreply@dermai.com'}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(message);
    console.log('[LOG] Email sent: %s', info.messageId);
    if (!process.env.SMTP_HOST) {
      console.log('[LOG] Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('[ERROR] Email sending failed:', error);
  }
};
