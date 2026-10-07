import React, { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, EyeOff, Microscope, Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

const API_URL = "http://localhost:5000";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");
    try {
      const endpoint = mode === "login" ? "/api/users/auth" : "/api/users";
      const body = mode === "login" ? { email: form.email, password: form.password } : form;
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Something went wrong");
      setSuccess(mode === "login" ? "Logged in successfully!" : "Account created! You can now sign in.");
      if (mode === "register") setMode("login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-up">
        <div className="text-center mb-8">
          <div className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 glow-primary">
            <Microscope className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{mode === "login" ? "Welcome back" : "Create account"}</h1>
          <p className="text-slate-600 text-sm mt-1">{mode === "login" ? "Sign in to your Dermai account" : "Start your skin health journey"}</p>
        </div>

        <div className="glass-strong rounded-3xl p-8 border border-sky-100 bg-white/90 shadow-[0_25px_50px_-35px_rgba(14,165,233,0.7)]">
          <div className="flex glass rounded-xl p-1 mb-6">
            {(["login", "register"] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(""); setSuccess(""); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === m ? "gradient-primary text-white" : "text-slate-600 hover:text-slate-900"}`}>
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="relative">
                <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                <input required value={form.name} onChange={set("name")} placeholder="Full Name"
                  className="w-full rounded-xl border border-sky-100 bg-white pl-10 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-colors" />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
              <input required type="email" value={form.email} onChange={set("email")} placeholder="Email address"
                className="w-full rounded-xl border border-sky-100 bg-white pl-10 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-colors" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
              <input required type={showPwd ? "text" : "password"} value={form.password} onChange={set("password")} placeholder="Password"
                className="w-full rounded-xl border border-sky-100 bg-white pl-10 pr-10 py-3 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-colors" />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-700 transition-colors">
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {mode === "login" && (
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-xs text-sky-600 hover:text-sky-700 transition-colors">Forgot password?</Link>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
            )}
            {success && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">{success}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full gradient-cta text-white font-semibold py-3.5 rounded-2xl hover:opacity-90 transition-all glow-primary flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              {mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-6">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setSuccess(""); }}
              className="text-sky-600 hover:text-sky-700 font-medium transition-colors">
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
