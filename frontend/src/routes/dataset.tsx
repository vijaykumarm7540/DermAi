import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Database, FileImage, BarChart3, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/dataset")({ component: DatasetPage });

const classes = [
  { name: "Melanocytic nevi", count: 6705, pct: 67 }, { name: "Melanoma", count: 1113, pct: 11 },
  { name: "Benign keratosis-like", count: 1099, pct: 11 }, { name: "Basal cell carcinoma", count: 514, pct: 5 },
  { name: "Actinic keratoses", count: 327, pct: 3 }, { name: "Vascular lesions", count: 142, pct: 1 },
  { name: "Dermatofibroma", count: 115, pct: 1 },
];

export default function DatasetPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-14 animate-fade-up">
        <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-4">Training Dataset</h1>
        <p className="text-gray-400 max-w-xl mx-auto">Dermai is trained on the publicly available HAM10000 dataset � a benchmark for skin lesion classification.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[["10,015", "Total Images"], ["7", "Disease Classes"], ["2013-2018", "Collection Period"], ["ISIC 2018", "Challenge Dataset"]].map(([v, l]) => (
          <div key={l} className="glass rounded-2xl p-5 text-center">
            <div className="text-2xl font-bold text-gradient mb-1">{v}</div>
            <div className="text-xs text-gray-400">{l}</div>
          </div>
        ))}
      </div>
      <div className="glass rounded-3xl p-6 mb-8">
        <h2 className="font-bold text-white mb-5 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-400" /> Class Distribution</h2>
        <div className="space-y-3">
          {classes.map((c) => (
            <div key={c.name}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-300">{c.name}</span>
                <span className="text-gray-500">{c.count.toLocaleString()} ({c.pct}%)</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full gradient-primary rounded-full transition-all" style={{ width: `${c.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="glass rounded-2xl p-6">
        <h2 className="font-bold text-white mb-4">Data Augmentation Techniques</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {["Random horizontal flip", "Random vertical flip", "Color jitter (�20%)", "Random rotation (�30�)", "Random crop & resize", "Normalization (ImageNet)"].map(aug => (
            <div key={aug} className="flex items-center gap-2 text-sm text-gray-400">
              <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
              {aug}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
