import React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { User, FileText, Calendar, LogOut, Settings } from "lucide-react";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

export default function ProfilePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gradient mb-8">My Profile</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-strong rounded-3xl p-6 text-center">
          <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 glow-primary">
            <User className="w-10 h-10 text-white" />
          </div>
          <h2 className="font-bold text-white text-lg">Guest User</h2>
          <p className="text-gray-400 text-sm mb-4">guest@dermai.ai</p>
          <Link to="/auth" className="gradient-cta text-white text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-all inline-block">
            Sign In
          </Link>
        </div>
        <div className="md:col-span-2 space-y-4">
          {[
            { icon: FileText, label: "Total Reports", value: "0", color: "text-blue-400" },
            { icon: Calendar, label: "Member Since", value: "—", color: "text-teal-400" },
            { icon: Settings, label: "Account Status", value: "Not logged in", color: "text-yellow-400" },
          ].map((s) => (
            <div key={s.label} className="glass rounded-2xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 glass rounded-xl flex items-center justify-center">
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-white font-semibold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
