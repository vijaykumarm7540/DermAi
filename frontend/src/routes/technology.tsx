import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Cpu, Database, Brain, Layers, BarChart3, Code2 } from "lucide-react";

export const Route = createFileRoute("/technology")({ component: TechnologyPage });

const stack = [
  { icon: Brain, title: "ResNet50", subtitle: "Backbone Model", desc: "A 50-layer deep residual network pre-trained on ImageNet. Fine-tuned on 10,000+ dermatological images for skin condition classification.", badge: "PyTorch" },
  { icon: Layers, title: "Transfer Learning", subtitle: "Training Strategy", desc: "Pre-trained ImageNet weights are frozen initially, then unfrozen for fine-tuning. Custom classification head added for 23 skin condition classes.", badge: "Fine-Tuned" },
  { icon: Database, title: "HAM10000 Dataset", subtitle: "Training Data", desc: "Human Against Machine with 10000 training images. 10,015 dermatoscopic images across 7 disease categories, augmented to 23 classes.", badge: "10K+ images" },
  { icon: BarChart3, title: "95.2% Accuracy", subtitle: "Model Performance", desc: "Validated on a held-out test set. Precision, recall, and F1-score metrics computed per-class using stratified k-fold cross-validation.", badge: "Top-1" },
  { icon: Cpu, title: "FastAPI + Python", subtitle: "Inference Server", desc: "The prediction endpoint runs via a Python Flask/FastAPI server. Images are pre-processed with PIL and torchvision transforms.", badge: "Real-time" },
  { icon: Code2, title: "MERN Stack", subtitle: "Web Platform", desc: "MongoDB, Express.js, React (TanStack), and Node.js power the user management, report storage, and frontend interface.", badge: "Full-Stack" },
];

export default function TechnologyPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-14 animate-fade-up">
        <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-4">Technology Stack</h1>
        <p className="text-gray-400 max-w-xl mx-auto">The cutting-edge ML architecture and full-stack engineering behind Dermai.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stack.map((t, i) => (
          <div key={i} className="glass rounded-2xl p-6 hover:border-blue-400/20 transition-all group animate-fade-up" style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center glow-soft group-hover:scale-110 transition-transform">
                <t.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs px-2 py-1 glass rounded-full text-blue-300 border border-blue-400/20">{t.badge}</span>
            </div>
            <h3 className="font-bold text-white mb-0.5">{t.title}</h3>
            <p className="text-xs text-blue-400 font-medium mb-3">{t.subtitle}</p>
            <p className="text-sm text-gray-400 leading-relaxed">{t.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
