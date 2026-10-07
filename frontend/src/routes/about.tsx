import React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Target, Heart, Users, Award } from "lucide-react";

export const Route = createFileRoute("/about")({ component: AboutPage });

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-14 animate-fade-up">
        <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-4">About Dermai</h1>
        <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Dermai is a final-year engineering project that combines deep learning and modern web development to democratize access to preliminary skin health insights.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {[
          { icon: Target, title: "Our Mission", desc: "To make early skin condition awareness accessible to everyone � regardless of location or healthcare access � using AI." },
          { icon: Heart, title: "Why It Matters", desc: "Skin cancer is the most common cancer worldwide. Early detection significantly improves survival rates. Dermai helps bridge the awareness gap." },
          { icon: Users, title: "Who It's For", desc: "General users seeking preliminary insights, dermatology students, researchers, and healthcare workers in under-served regions." },
          { icon: Award, title: "Academic Context", desc: "Final Year Project 2027 � combining computer vision, full-stack development, and medical informatics into a cohesive platform." },
        ].map((c, i) => (
          <div key={i} className="glass rounded-2xl p-6 hover:border-blue-400/20 transition-all animate-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mb-4 glow-soft">
              <c.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-white mb-2">{c.title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>
      <div className="glass-strong rounded-3xl p-8 text-center glow-soft">
        <p className="text-gray-300 text-sm mb-4">?? <strong className="text-white">Important Disclaimer</strong></p>
        <p className="text-gray-400 text-sm leading-relaxed max-w-2xl mx-auto">
          Dermai is designed for educational and informational purposes only. It is NOT a medical device and should NOT be used as a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified dermatologist for any skin concerns.
        </p>
        <Link to="/analyze" className="mt-6 gradient-cta text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-all inline-block glow-soft">
          Try The Analyzer
        </Link>
      </div>
    </div>
  );
}
