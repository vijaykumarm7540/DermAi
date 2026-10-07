import React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Download, History, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/report")({ component: ReportPage });

export default function ReportPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-10 animate-fade-up">
        <h1 className="text-4xl font-bold text-gradient mb-3">My Reports</h1>
        <p className="text-gray-400">View and download your skin analysis history.</p>
      </div>
      <div className="glass-strong rounded-3xl p-12 text-center">
        <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center mx-auto mb-5">
          <History className="w-8 h-8 text-blue-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">No reports yet</h2>
        <p className="text-gray-400 text-sm mb-6">Sign in and run an analysis to see your reports here.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/analyze" className="gradient-cta text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-all inline-flex items-center gap-2 glow-soft">
            <FileText className="w-4 h-4" /> Run Analysis <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/auth" className="glass text-white font-semibold px-6 py-3 rounded-xl hover:border-blue-400/30 transition-all inline-flex items-center gap-2">
            Sign In to View History
          </Link>
        </div>
      </div>
    </div>
  );
}
