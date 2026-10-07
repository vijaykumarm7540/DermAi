import React, { useState, useRef, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { jsPDF } from "jspdf";
import { Upload, ScanLine, AlertCircle, CheckCircle2, X, FileText, RefreshCw, Loader2 } from "lucide-react";

export const Route = createFileRoute("/analyze")({
  component: AnalyzePage,
});

const API_URL = "http://localhost:5000";

interface Prediction {
  condition: string;
  confidence: number;
  description: string;
  severity: "low" | "medium" | "high";
}

interface RagReport {
  insight: string;
  provider?: string;
  isSimulated?: boolean;
  heatmapUrl?: string;
}

const normalizePrediction = (value: unknown) => {
  if (typeof value !== "string") return "Unknown";
  const cleaned = value.trim();
  if (!cleaned) return "Unknown";
  return cleaned;
};

const toSeverity = (value: number | string | undefined): "low" | "medium" | "high" => {
  const numeric = typeof value === "number" ? value : Number(value ?? 0);
  if (Number.isNaN(numeric)) return "medium";
  if (numeric >= 70) return "high";
  if (numeric >= 40) return "medium";
  return "low";
};

function UploadZone({ onFile }: { onFile: (f: File) => void }) {
  const [drag, setDrag] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) onFile(file);
  }, [onFile]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      onClick={() => ref.current?.click()}
      className={`cursor-pointer rounded-3xl border-2 border-dashed transition-all p-12 text-center ${
        drag ? "border-blue-400 bg-blue-500/10" : "border-blue-500/30 hover:border-blue-400/60 hover:bg-blue-500/5"
      }`}
    >
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) onFile(f);
      }} />
      <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 glow-soft animate-float">
        <Upload className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">Drop your image here</h3>
      <p className="text-sm text-slate-600 mb-4">or click to browse — JPG, PNG, WEBP up to 10MB</p>
      <span className="gradient-cta text-white text-sm font-semibold px-5 py-2.5 rounded-xl inline-block">Choose File</span>
    </div>
  );
}

function SeverityBadge({ s }: { s: "low" | "medium" | "high" }) {
  const map = { low: "text-teal-400 bg-teal-400/10 border-teal-400/30", medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30", high: "text-red-400 bg-red-400/10 border-red-400/30" };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${map[s]}`}>{s.toUpperCase()}</span>;
}

export default function AnalyzePage() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Prediction[] | null>(null);
  const [ragReport, setRagReport] = useState<RagReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResults(null);
    setRagReport(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    setRagReport(null);

    try {
      const form = new FormData();
      form.append("image", image);

      const analyzeRes = await fetch(`${API_URL}/api/insights/analyze`, {
        method: "POST",
        body: form,
        credentials: "include",
      });

      if (!analyzeRes.ok) {
        throw new Error("Image analysis failed");
      }

      const analysis = await analyzeRes.json();
      const prediction = normalizePrediction(analysis.prediction ?? analysis.className ?? "Unknown");
      const confidence = Number(analysis.confidence ?? 0) * 100 || 0;
      const severity = toSeverity(confidence);

      const reportRes = await fetch(`${API_URL}/api/insights/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prediction,
          confidence: Math.max(0, Math.min(100, confidence)),
          severity: severity.toUpperCase(),
        }),
      });

      if (!reportRes.ok) {
        throw new Error("RAG report generation failed");
      }

      const reportData = await reportRes.json();
      const singlePrediction: Prediction = {
        condition: prediction,
        confidence: Number((confidence || 0).toFixed(1)),
        description: reportData?.insight || "AI-generated skin assessment generated from the uploaded image.",
        severity,
      };

      setResults([singlePrediction]);
      setRagReport({
        insight: reportData?.insight || "No report generated.",
        provider: reportData?.provider || "AI analysis engine",
        isSimulated: Boolean(reportData?.isSimulated),
        heatmapUrl: analysis.heatmapUrl ? `${API_URL}${analysis.heatmapUrl}` : undefined,
      });
    } catch (err) {
      console.error(err);
      setError("The analysis could not be completed. Please try another image or check the backend connection.");
      setResults(null);
      setRagReport(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!results?.[0]) return;

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFillColor(236, 246, 255);
    doc.rect(0, 0, pageWidth, pageHeight, "F");
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(22);
    doc.text("Dermai Skin Analysis Report", 40, 50);

    try {
      const imageSource = ragReport?.heatmapUrl || preview || "";
      if (imageSource) {
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = imageSource;
        });

        const fitWidth = 220;
        const fitHeight = 180;
        doc.addImage(image, "PNG", 40, 80, fitWidth, fitHeight);
      }
    } catch {
      // Ignore image embedding failures and continue with text-only PDF
    }

    doc.setFontSize(12);
    let y = 290;
    doc.text(`Prediction: ${results[0].condition}`, 40, y);
    y += 20;
    doc.text(`Confidence: ${results[0].confidence}%`, 40, y);
    y += 20;
    doc.text(`Severity: ${results[0].severity.toUpperCase()}`, 40, y);
    y += 26;

    const insight = ragReport?.insight || results[0].description;
    const wrapped = doc.splitTextToSize(insight, 500);
    doc.text(wrapped, 40, y, { maxWidth: 500 });

    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    doc.text("Disclaimer: This report is AI-assisted and is not a medical diagnosis. Please consult a certified dermatologist.", 40, 760, { maxWidth: 500 });

    doc.save("dermai-report.pdf");
  };

  const reset = () => { setImage(null); setPreview(null); setResults(null); setRagReport(null); setError(null); };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-10 animate-fade-up">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold glass border border-blue-400/20 text-blue-300 mb-4">
          <ScanLine className="w-3.5 h-3.5" /> AI Analysis Engine
        </span>
        <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-3">Skin Condition Analyzer</h1>
        <p className="text-gray-400 max-w-xl mx-auto">Upload a clear, well-lit photo of the skin area. Our AI will analyze it for 23 possible conditions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload / Preview panel */}
        <div className="glass rounded-3xl p-6">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Upload className="w-4 h-4 text-blue-400" /> Upload Image</h2>

          {!preview ? (
            <UploadZone onFile={handleFile} />
          ) : (
            <div className="relative rounded-2xl overflow-hidden">
              <img src={preview} alt="preview" className="w-full h-64 object-cover rounded-2xl" />
              <button onClick={reset} className="absolute top-3 right-3 w-8 h-8 glass rounded-full flex items-center justify-center text-white hover:bg-red-500/20 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {preview && !results && (
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="mt-4 w-full gradient-cta text-white font-semibold py-3.5 rounded-2xl hover:opacity-90 transition-all glow-primary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing…</> : <><ScanLine className="w-5 h-5" /> Analyze Now</>}
            </button>
          )}

          {results && (
            <button onClick={reset} className="mt-4 w-full glass text-slate-900 font-semibold py-3 rounded-2xl hover:border-blue-400/30 transition-all flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4" /> Analyze Another Image
            </button>
          )}

          {/* Tips */}
          <div className="mt-6 space-y-2">
            {["Use natural daylight for best results", "Focus on the affected area clearly", "Avoid blurry or dark images"].map((tip) => (
              <div key={tip} className="flex items-start gap-2 text-xs text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 mt-0.5 flex-shrink-0" />
                {tip}
              </div>
            ))}
          </div>
        </div>

        {/* Results panel */}
        <div className="glass rounded-3xl p-6">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-400" /> Analysis Results</h2>

          {!results && !loading && (
            <div className="h-64 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center mb-4 animate-pulse">
                <ScanLine className="w-8 h-8 text-blue-400/50" />
              </div>
              <p className="text-slate-600 text-sm">Upload and analyze an image<br />to see results here.</p>
            </div>
          )}

          {loading && (
            <div className="h-64 flex flex-col items-center justify-center gap-4">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-4 border-blue-500/20" />
                <div className="absolute inset-0 rounded-full border-4 border-t-blue-400 animate-spin" />
                <ScanLine className="absolute inset-0 m-auto w-8 h-8 text-blue-400 animate-pulse" />
              </div>
              <p className="text-slate-600 text-sm">Running AI inference…</p>
            </div>
          )}

          {results && (
            <div className="space-y-4 animate-fade-up">
              <div className="glass-strong rounded-2xl p-5 border border-blue-400/20 glow-soft">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-xs text-blue-400 font-semibold mb-1">PRIMARY DIAGNOSIS</p>
                    <h3 className="font-bold text-slate-900 text-lg">{results[0].condition}</h3>
                  </div>
                  <SeverityBadge s={results[0].severity} />
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Confidence</span><span className="font-semibold text-slate-900">{results[0].confidence}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full gradient-cta rounded-full transition-all" style={{ width: `${results[0].confidence}%` }} />
                  </div>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{results[0].description}</p>
              </div>

              <button
                type="button"
                onClick={handleDownloadReport}
                className="w-full rounded-2xl border border-sky-400/30 bg-sky-500/10 px-4 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-sky-500/15"
              >
                Download report PDF
              </button>

              <div className="flex items-start gap-2 p-3 rounded-xl bg-yellow-400/5 border border-yellow-400/20">
                <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-300/80">This is AI-generated analysis for educational purposes only. Always consult a certified dermatologist for medical advice.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {ragReport && (
        <section className="mx-auto mt-10 max-w-5xl rounded-[28px] border border-sky-100 bg-white/90 p-6 shadow-[0_20px_55px_-35px_rgba(14,165,233,0.7)] md:p-10">
          <div className="mb-6 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">RAG-analyzed report</p>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 md:text-5xl">Detailed AI skin assessment</h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="overflow-hidden rounded-[24px] border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-4 shadow-inner">
              {(ragReport?.heatmapUrl || preview) ? (
                <img src={ragReport?.heatmapUrl || preview || ""} alt="Uploaded skin lesion preview" className="h-[360px] w-full rounded-[20px] object-cover" />
              ) : (
                <div className="flex h-[360px] items-center justify-center rounded-[20px] bg-slate-100 text-sm text-slate-500">
                  Image preview unavailable
                </div>
              )}
            </div>

            <div className="rounded-[24px] border border-sky-100 bg-slate-900 p-6 text-white shadow-[0_20px_60px_-35px_rgba(14,165,233,0.8)] md:p-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">Assessment</p>
                  <h3 className="mt-2 text-2xl font-bold text-white">{results?.[0]?.condition ?? "Skin analysis"}</h3>
                </div>
                <span className="rounded-full bg-rose-400/15 px-3 py-1 text-xs font-semibold text-rose-200">
                  {ragReport.isSimulated ? "Fallback" : "Live"}
                </span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  { label: "AI confidence", value: `${results?.[0]?.confidence ?? 0}%` },
                  { label: "Severity", value: results?.[0]?.severity ? results[0].severity.toUpperCase() : "MEDIUM" },
                  { label: "Source", value: ragReport.provider || "AI model" },
                  { label: "Mode", value: ragReport.isSimulated ? "Fallback" : "RAG" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-sky-200">{item.label}</div>
                    <div className="mt-2 text-lg font-bold text-white">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4 text-sm leading-relaxed text-sky-50 whitespace-pre-line">
                {ragReport.insight}
              </div>
            </div>
          </div>
        </section>
      )}

      {error && (
        <div className="mx-auto mt-8 max-w-5xl rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-200">
          {error}
        </div>
      )}
    </div>
  );
}
