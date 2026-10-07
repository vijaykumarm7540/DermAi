import React, { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({ component: ForgotPasswordPage });

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setSent(true); setLoading(false);
  };
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-up">
        <Link to="/auth" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </Link>
        <div className="glass-strong rounded-3xl p-8">
          <div className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-5 glow-primary">
            <Mail className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white text-center mb-2">Reset Password</h1>
          <p className="text-gray-400 text-sm text-center mb-6">Enter your email and we will send a reset link.</p>
          {!sent ? (
            <form onSubmit={submit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address"
                  className="w-full glass rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 outline-none" />
              </div>
              <button type="submit" disabled={loading} className="w-full gradient-cta text-white font-semibold py-3.5 rounded-2xl hover:opacity-90 transition-all glow-primary flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null} Send Reset Link
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <CheckCircle2 className="w-12 h-12 text-teal-400 mx-auto mb-3" />
              <p className="text-white font-medium mb-1">Check your email!</p>
              <p className="text-gray-400 text-sm">We sent a password reset link to <strong className="text-white">{email}</strong></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
