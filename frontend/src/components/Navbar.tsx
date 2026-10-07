import React, { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X, Brain, Microscope } from "lucide-react";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/analyze", label: "Analyze" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/technology", label: "Technology" },
  { to: "/dataset", label: "Dataset" },
  { to: "/about", label: "About" },
  { to: "/faq", label: "FAQ" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const router = useRouterState();
  const current = router.location.pathname;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-sky-100/80 bg-[#f3f6f9]/90 backdrop-blur-xl shadow-[0_10px_30px_-20px_rgba(14,165,233,0.5)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-6">
          <Link to="/" className="group flex items-center gap-3 rounded-full border border-sky-100 bg-slate-900/95 px-3 py-2 text-white shadow-[0_10px_20px_-16px_rgba(15,23,42,0.9)]">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15">
              <Microscope className="h-4 w-4 text-sky-300" />
            </div>
            <div className="leading-none">
              <div className="text-[12px] font-bold tracking-tight">Dermai</div>
              <div className="mt-0.5 text-[8px] font-medium uppercase tracking-[0.18em] text-slate-300">Skin Scanner</div>
            </div>
          </Link>

          <div className="hidden flex-1 items-center justify-center md:flex">
            <div className="flex items-center gap-1 rounded-full border border-sky-100 bg-white/70 px-1.5 py-1 shadow-sm backdrop-blur-sm">
              {navLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`rounded-full px-3 py-2 text-sm font-medium transition-all ${
                    current === l.to
                      ? "bg-sky-200/80 text-sky-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/auth" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">Sign In</Link>
            <Link to="/auth" className="rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_18px_-12px_rgba(14,165,233,0.9)] transition-transform hover:-translate-y-0.5">
              Get Started
            </Link>
          </div>

          <button onClick={() => setOpen(!open)} className="p-2 text-slate-700 hover:text-slate-900 md:hidden">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-sky-100 bg-white/95 px-4 py-3 shadow-lg md:hidden">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                current === l.to ? "bg-sky-100 text-sky-700" : "text-slate-600"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-2">
            <Link to="/auth" onClick={() => setOpen(false)} className="block rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 px-4 py-2.5 text-center text-sm font-semibold text-white">
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
