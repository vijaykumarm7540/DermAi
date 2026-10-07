import React, { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Bot,
  Brain,
  Camera,
  CheckCircle2,
  FileText,
  Microscope,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Upload,
  type LucideIcon,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomePage,
});

const DISEASES = ["Melanoma", "Mole check", "Pigmented lesion", "Skin spot", "Texture scan"];

function AnimatedBadge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 shadow-sm">
      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
      {text}
    </span>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="glass rounded-2xl p-5 text-center shadow-[0_12px_30px_-20px_rgba(14,165,233,0.38)]">
      <div className="mb-1 text-3xl font-extrabold text-gradient">{value}</div>
      <div className="text-sm text-slate-600">{label}</div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: LucideIcon; title: string; desc: string }) {
  return (
    <div className="info-card rounded-2xl border border-sky-100 p-6 shadow-[0_12px_30px_-22px_rgba(14,165,233,0.55)] transition-transform hover:-translate-y-1">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 text-white shadow-lg shadow-sky-200">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-600">{desc}</p>
    </div>
  );
}

function StepCard({ num, icon: Icon, title, desc }: { num: number; icon: LucideIcon; title: string; desc: string }) {
  return (
    <div className="relative rounded-3xl border border-sky-100 bg-white/80 p-6 text-center shadow-[0_20px_45px_-28px_rgba(14,165,233,0.55)]">
      <div className="absolute -top-3 right-6 flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-sm font-bold text-white shadow-lg shadow-sky-200">
        {num}
      </div>
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-400 text-white shadow-lg shadow-sky-200">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-600">{desc}</p>
    </div>
  );
}

type ReportMetric = {
  label: string;
  value: number;
};

type ReportSummary = {
  prediction: string;
  confidence: number;
  severity: string;
  summary: string;
  provider: string;
  metrics: ReportMetric[];
};

const DEFAULT_REPORT: ReportSummary = {
  prediction: "Melanoma risk review",
  confidence: 92,
  severity: "Moderate",
  provider: "AI assessment",
  summary:
    "The lesion shows uneven borders and mixed pigmentation. The system cross-references visible image features with dermatology knowledge to highlight a possible malignant pattern and recommends a professional exam.",
  metrics: [
    { label: "Border irregularity", value: 82 },
    { label: "Color variation", value: 74 },
    { label: "Growth pattern", value: 68 },
  ],
};

export default function HomePage() {
  const [report, setReport] = useState<ReportSummary>(DEFAULT_REPORT);
  const [isLoadingReport, setIsLoadingReport] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchReport = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/insights/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prediction: "Melanoma",
            confidence: 92,
            severity: "Moderate",
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate RAG report");
        }

        const data = await response.json();

        if (!isMounted) return;

        const insightText = data?.insight || DEFAULT_REPORT.summary;
        const nextReport: ReportSummary = {
          prediction: "Melanoma risk review",
          confidence: 92,
          severity: "Moderate",
          provider: data?.provider || DEFAULT_REPORT.provider,
          summary: insightText.replace(/\*\*|\*|\n+/g, " ").trim(),
          metrics: [
            { label: "Border irregularity", value: 82 },
            { label: "Color variation", value: 74 },
            { label: "Growth pattern", value: 68 },
          ],
        };

        setReport(nextReport);
      } catch (error) {
        console.error("RAG report load failed:", error);
        if (isMounted) {
          setReport(DEFAULT_REPORT);
        }
      } finally {
        if (isMounted) {
          setIsLoadingReport(false);
        }
      }
    };

    fetchReport();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="overflow-x-hidden bg-transparent">
      <section className="relative px-4 pb-14 pt-10 md:pb-20 md:pt-14">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-8 top-14 h-72 w-72 rounded-full bg-sky-200/60 blur-3xl" />
          <div className="absolute right-8 top-28 h-80 w-80 rounded-full bg-cyan-200/60 blur-3xl" />
          <div className="absolute bottom-10 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-100/70 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="animate-fade-up">
              <AnimatedBadge text="AI-powered skin analysis" />

              <h1 className="mt-6 text-5xl font-black leading-none tracking-tight text-slate-900 md:text-6xl lg:text-7xl">
                Check your <span className="text-gradient">skin!</span>
              </h1>

              <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
                Upload a photo of a skin concern and get instant AI insights about visible changes, skin features, and what may deserve attention.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link to="/analyze" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-sky-200 transition-transform hover:-translate-y-0.5">
                  <Microscope className="h-5 w-5" />
                  Get instant result
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/how-it-works" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 shadow-sm transition-colors hover:border-sky-300 hover:text-sky-700">
                  Learn more
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {DISEASES.map((d) => (
                  <span key={d} className="rounded-full border border-sky-100 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
                    {d}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative animate-fade-up">
              <div className="absolute -inset-5 rounded-[32px] bg-gradient-to-br from-sky-200/60 to-cyan-200/40 blur-2xl" />

              <div className="melanoma-float absolute -left-5 top-8 z-10 w-24 rounded-2xl border border-sky-100 bg-white/80 p-2 shadow-[0_15px_30px_-18px_rgba(14,165,233,0.8)] backdrop-blur-sm">
                <img src="/ai-derm-assets/mole-8WukUUWm.webp" alt="Melanoma lesion preview" className="h-20 w-full rounded-xl object-cover" />
                <div className="mt-2 text-center text-[10px] font-semibold uppercase tracking-wide text-sky-700">Melanoma</div>
              </div>

              <div className="melanoma-float absolute -right-3 bottom-12 z-10 w-24 rounded-2xl border border-sky-100 bg-white/80 p-2 shadow-[0_15px_30px_-18px_rgba(14,165,233,0.8)] backdrop-blur-sm">
                <img src="/ai-derm-assets/mole-8WukUUWm.webp" alt="Pigmented skin spot" className="h-20 w-full rounded-xl object-cover" />
                <div className="mt-2 text-center text-[10px] font-semibold uppercase tracking-wide text-sky-700">Spot</div>
              </div>

              <div className="skin-hero-shell relative overflow-hidden rounded-[32px] border border-sky-100 bg-white/85 p-3 shadow-[0_30px_60px_-30px_rgba(14,165,233,0.7)] backdrop-blur-xl">
                <div className="skin-hero-card rounded-[28px] border border-sky-100 bg-white/80 p-2">
                  <div
                    className="relative overflow-hidden rounded-[22px] border border-sky-100 bg-cover bg-center"
                    style={{ backgroundImage: "url('/ai-derm-assets/bg-medium-BbqzpBm1.webp')" }}
                  >
                    <div className="scan-overlay" />
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2 rounded-2xl bg-slate-950/90 px-2.5 py-1.5 shadow-lg ring-1 ring-white/10">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 text-white shadow-md">
                          <Camera className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">Dermai</p>
                          <p className="text-[10px] text-slate-300">Skin Scanner</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                        Live
                      </span>
                    </div>

                    <div className="px-4 pb-4 pt-2">
                      <div className="melanoma-video-panel rounded-[22px] border border-white/60 bg-white/75 p-3 shadow-lg backdrop-blur-sm">
                        <div className="melanoma-video-badge">
                          <span className="dot" />
                          <span>Live</span>
                        </div>
                        <div className="mb-3 flex items-center justify-between text-[10px] font-medium text-slate-600">
                          <span>Step 1</span>
                          <span>Photo</span>
                        </div>
                        <img
                          src="/ai-derm-assets/mole-8WukUUWm.webp"
                          alt="Mole skin image"
                          className="h-56 w-full rounded-2xl object-cover shadow-[0_0_0_1px_rgba(255,255,255,0.4)]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-4 gap-2 px-1">
                    {[
                      { src: "/ai-derm-assets/step1-DmSNb1_m.png", label: "Photo" },
                      { src: "/ai-derm-assets/step2-DiFxCqbn.png", label: "Analyze" },
                      { src: "/ai-derm-assets/step3-BU-cnAOs.png", label: "PDF" },
                      { src: "/ai-derm-assets/step4-x3SrNPQm.png", label: "Consultant" },
                    ].map((step) => (
                      <div key={step.label} className="rounded-2xl border border-sky-100 bg-sky-50/70 p-2 text-center shadow-sm transition-transform hover:-translate-y-1">
                        <img src={step.src} alt={step.label} className="mx-auto h-12 w-12 object-contain" />
                        <div className="mt-2 text-[10px] font-medium text-slate-600">{step.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      <section className="px-4 py-14 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">How it works</p>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 md:text-5xl">Smart insights in 3 simple steps</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <StepCard num={1} icon={Upload} title="Take a photo" desc="Capture a clear image of the skin area you want to check." />
            <StepCard num={2} icon={ScanLine} title="AI instantly analyzes" desc="Our trained model scans the image for visible skin patterns and anomalies." />
            <StepCard num={3} icon={FileText} title="Get a report" desc="Review a concise summary with confidence scores and next steps." />
          </div>
        </div>
      </section>

      <section className="px-4 py-14 md:py-20">
        <div className="mx-auto max-w-6xl rounded-[32px] border border-sky-100 bg-white/90 p-8 shadow-[0_20px_55px_-35px_rgba(14,165,233,0.7)] md:p-12">
          <div className="mb-10 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Why choose us</p>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 md:text-5xl">Why should you use Derm Ai?</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <FeatureCard icon={Brain} title="Deep learning model" desc="Built to identify common visible skin changes using trained dermatology data and image analysis." />
            <FeatureCard icon={Activity} title="Fast, personal guidance" desc="Get useful insights in about a minute so you can understand visible skin patterns quickly." />
            <FeatureCard icon={ShieldCheck} title="Secure by design" desc="Your images are handled with privacy in mind and are never used without your consent." />
          </div>
        </div>
      </section>

      <section className="px-4 py-14 md:py-20">
        <div className="mx-auto max-w-6xl rounded-[32px] bg-gradient-to-r from-sky-900 via-sky-800 to-cyan-800 p-8 text-white shadow-[0_25px_50px_-30px_rgba(14,165,233,0.9)] md:p-12">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_1fr]">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-sky-200">What can you learn in 1 minute?</p>
              <h3 className="text-3xl font-black tracking-tight md:text-5xl">Understand visible skin changes and the next steps.</h3>
              <ul className="mt-6 space-y-3 text-sky-50">
                {[
                  "Information about visible skin changes",
                  "Insights about moles and skin spots",
                  "Common skin concerns and features to look out for",
                  "Educational context for your skin health"
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/analyze" className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-base font-semibold text-sky-700 shadow-lg transition-transform hover:-translate-y-0.5">
                Try now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="relative">
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                <div className="rounded-[24px] border border-sky-200/30 bg-white/10 p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/30 text-sky-50">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold">Derm Ai overview</p>
                      <p className="text-sm text-sky-100">Quick screening summary</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { label: "Lesion type", value: "Pigmented" },
                      { label: "Color variation", value: "Moderate" },
                      { label: "Skin feature", value: "Asymmetry" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm">
                        <span className="text-sky-100">{item.label}</span>
                        <span className="font-semibold text-white">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-2xl border border-sky-400/25 bg-slate-950/30 p-4">
                    <div className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-[0.15em] text-sky-200">
                      <span>RAG report</span>
                      <span>92%</span>
                    </div>
                    <div className="space-y-2 pt-1">
                      {[
                        { label: "Border irregularity", value: 82 },
                        { label: "Color variation", value: 74 },
                        { label: "Growth pattern", value: 68 },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="mb-1 flex items-center justify-between text-[11px] text-sky-100">
                            <span>{item.label}</span>
                            <span>{item.value}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-white/10">
                            <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-300" style={{ width: `${item.value}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 md:py-20">
        <div className="mx-auto max-w-6xl rounded-[32px] border border-sky-100 bg-white/90 p-6 shadow-[0_20px_55px_-35px_rgba(14,165,233,0.7)] md:p-10">
          <div className="mb-8 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">RAG-analyzed report</p>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 md:text-5xl">Detailed AI skin assessment</h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="overflow-hidden rounded-[28px] border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-4 shadow-inner">
              <img
                src="/ai-derm-assets/mole-8WukUUWm.webp"
                alt="Melanoma skin report preview"
                className="h-[360px] w-full rounded-[22px] object-cover"
              />
            </div>

            <div className="rounded-[28px] border border-sky-100 bg-slate-900 p-6 text-white shadow-[0_20px_60px_-35px_rgba(14,165,233,0.8)] md:p-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">Assessment</p>
                  <h3 className="mt-2 text-2xl font-bold text-white">{report.prediction}</h3>
                </div>
                <span className="rounded-full bg-rose-400/15 px-3 py-1 text-xs font-semibold text-rose-200">{isLoadingReport ? "Loading…" : report.severity}</span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  { label: "AI confidence", value: `${report.confidence}%` },
                  { label: "Severity", value: report.severity },
                  { label: "Pattern", value: "Asymmetry" },
                  { label: "Color var.", value: "Multi-tonal" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-sky-200">{item.label}</div>
                    <div className="mt-2 text-xl font-bold text-white">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-4">
                {report.metrics.map((bar) => (
                  <div key={bar.label}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-sky-100">{bar.label}</span>
                      <span className="font-semibold text-white">{bar.value}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-300" style={{ width: `${bar.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-200">
                <span>RAG source</span>
                <span>{isLoadingReport ? "Loading…" : report.provider}</span>
              </div>

              <div className="mt-6 rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4 text-sm leading-relaxed text-sky-50">
                {isLoadingReport ? "Generating report details…" : report.summary}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 pt-8 md:pb-24">
        <div className="mx-auto max-w-5xl rounded-[32px] border border-sky-100 bg-gradient-to-br from-white to-sky-50 p-8 text-center shadow-[0_25px_60px_-35px_rgba(14,165,233,0.8)] md:p-12">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Your skin deserves attention</p>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 md:text-5xl">Stay informed before small changes become bigger concerns.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Answer a few quick questions to get AI-powered insights about your skin and better understand what to monitor.
          </p>
          <Link to="/analyze" className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-sky-200 transition-transform hover:-translate-y-0.5">
            Act now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

