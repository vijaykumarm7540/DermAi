import React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Upload, Brain, ScanLine, FileText, ShieldCheck, Cpu, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/how-it-works")({ component: HowItWorksPage });

const steps = [
  { icon: Upload, title: "1. Upload Your Image", desc: "Take a clear, well-lit photo of the skin condition you want to analyze. Supported formats: JPG, PNG, WEBP. Maximum size: 10MB.", color: "from-blue-600 to-blue-400" },
  { icon: Brain, title: "2. AI Pre-processing", desc: "Your image is resized, normalized and fed through our preprocessing pipeline to ensure consistent, high-quality input for the model.", color: "from-purple-600 to-blue-500" },
  { icon: ScanLine, title: "3. Deep Learning Inference", desc: "Our fine-tuned ResNet50 model analyzes 512 feature maps extracted from your image and runs classification across 23 skin condition categories.", color: "from-teal-600 to-blue-500" },
  { icon: BarChart3, title: "4. Confidence Scoring", desc: "Softmax probabilities are computed for each class, giving you a ranked list of possible diagnoses with percentage confidence scores.", color: "from-indigo-600 to-purple-500" },
  { icon: FileText, title: "5. Report Generation", desc: "A detailed PDF report is compiled with your top diagnosis, confidence breakdown, condition descriptions, and recommended next steps.", color: "from-blue-500 to-teal-400" },
];

export default function HowItWorksPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-14 animate-fade-up">
        <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-4">How Dermai Works</h1>
        <p className="text-gray-400 max-w-xl mx-auto">A transparent look at the technology powering your skin analysis � from photo to diagnosis in under 3 seconds.</p>
      </div>
      <div className="space-y-6">
        {steps.map((s, i) => (
          <div key={i} className="glass rounded-2xl p-6 flex gap-5 items-start hover:border-blue-400/20 transition-all animate-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className={`w-14 h-14 bg-gradient-to-br ${s.color} rounded-2xl flex items-center justify-center flex-shrink-0 glow-soft`}>
              <s.icon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg mb-2">{s.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-10 text-center">
        <Link to="/analyze" className="gradient-cta text-white font-semibold px-8 py-4 rounded-2xl hover:opacity-90 transition-all glow-primary inline-flex items-center gap-2">
          <ScanLine className="w-5 h-5" /> Try It Now
        </Link>
      </div>
    </div>
  );
}
