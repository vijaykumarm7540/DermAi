import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";

export const Route = createFileRoute("/faq")({ component: FaqPage });

const faqs = [
  { q: "Is Dermai a medical device?", a: "No. Dermai is an educational tool built as a final year engineering project. It should NOT be used as a substitute for professional medical advice. Always consult a certified dermatologist." },
  { q: "How accurate is the AI?", a: "Our ResNet50 model achieves ~95.2% top-1 accuracy on the HAM10000 test set. However, real-world accuracy may vary depending on image quality, lighting, and skin tone." },
  { q: "Is my image stored?", a: "Images uploaded for analysis are processed in memory and not permanently stored unless you are signed in and explicitly choose to save your report." },
  { q: "What skin conditions can it detect?", a: "The model is trained to classify 7 primary categories: melanocytic nevi, melanoma, benign keratosis-like lesions, basal cell carcinoma, actinic keratoses, vascular lesions, and dermatofibroma." },
  { q: "What makes a good photo?", a: "Use natural daylight or bright indoor light. Hold the camera steady and close to the skin. Ensure the lesion fills at least 30% of the frame. Avoid blur and shadows." },
  { q: "Can I download my report?", a: "Yes! Signed-in users can download a detailed PDF report with their diagnosis, confidence scores, and recommended next steps." },
  { q: "Is Dermai free?", a: "Yes, basic analysis is completely free. Creating an account is free and gives you access to report history, PDF downloads, and more." },
];

export default function FaqPage() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-14 animate-fade-up">
        <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-4">Frequently Asked Questions</h1>
        <p className="text-gray-400">Everything you need to know about Dermai.</p>
      </div>
      <div className="space-y-3">
        {faqs.map((f, i) => (
          <div key={i} className={`glass rounded-2xl overflow-hidden transition-all ${open === i ? "border-blue-400/20" : ""}`}>
            <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left">
              <span className="font-medium text-white text-sm pr-4">{f.q}</span>
              <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} />
            </button>
            {open === i && (
              <div className="px-5 pb-5 text-sm text-gray-400 leading-relaxed border-t border-blue-500/10 pt-4">
                {f.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
