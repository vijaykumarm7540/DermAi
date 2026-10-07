import React from "react";
import { Link } from "@tanstack/react-router";
import { Microscope, Github, Twitter, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-sky-100 bg-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center shadow-md shadow-sky-200">
                <Microscope className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-slate-900">Dermai</span>
            </div>
            <p className="text-slate-600 text-sm max-w-xs leading-relaxed">
              AI-powered skin disease analysis using deep learning. Upload a photo, get instant insights.
            </p>
            <div className="flex gap-3 mt-4">
              {[Github, Twitter, Linkedin].map((Icon, i) => (
                <button key={i} className="w-9 h-9 rounded-lg border border-sky-100 bg-sky-50 flex items-center justify-center text-slate-600 hover:text-sky-700 hover:border-sky-200 transition-all">
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Platform</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              {[["Analyze", "/analyze"], ["How It Works", "/how-it-works"], ["Technology", "/technology"], ["Dataset", "/dataset"]].map(([label, to]) => (
                <li key={to}><Link to={to} className="hover:text-sky-700 transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              {[["About", "/about"], ["FAQ", "/faq"], ["Sign In", "/auth"]].map(([label, to]) => (
                <li key={to}><Link to={to} className="hover:text-sky-700 transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-sky-100 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500">© 2027 Dermai. All rights reserved. For educational purposes only.</p>
          <p className="text-xs text-slate-500">Not a substitute for professional medical advice.</p>
        </div>
      </div>
    </footer>
  );
}
