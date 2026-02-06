"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Target,
  Shield,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Share2,
  MessageSquare,
  Database,
  FileText,
  Sparkles,
  Users,
  CalendarClock,
} from "lucide-react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from "recharts";
import type { FinalReportData } from "@/lib/reportTypes";
import type { MarketState } from "@/lib/types";

const scoreColor = (score: number) => {
  if (score >= 8) return "text-emerald-400";
  if (score >= 5) return "text-amber-400";
  return "text-rose-400";
};

const scoreGlow = (score: number) => {
  if (score >= 8) return "shadow-[0_0_80px_-20px_rgba(16,185,129,0.55)]";
  if (score >= 5) return "shadow-[0_0_80px_-20px_rgba(245,158,11,0.50)]";
  return "shadow-[0_0_80px_-20px_rgba(244,63,94,0.45)]";
};

const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25 }}
    className={`bg-slate-900/55 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 overflow-hidden relative ${className}`}
  >
    {/* subtle top shine */}
    <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/5 to-transparent" />
    {children}
  </motion.div>
);

type ToastKind = "success" | "info" | "error";

const toastStyles: Record<ToastKind, string> = {
  success: "bg-emerald-500 text-slate-950",
  info: "bg-indigo-500 text-white",
  error: "bg-rose-500 text-white",
};

type Driver = { factor?: string; score?: number };

const ScoreRing = ({ score }: { score: number }) => {
  const clamped = Math.max(0, Math.min(10, Number.isFinite(score) ? score : 0));
  const pct = (clamped / 10) * 100;

  return (
    <div className="relative w-28 h-28">
      <svg viewBox="0 0 36 36" className="w-full h-full">
        <path
          d="M18 2.0845
             a 15.9155 15.9155 0 0 1 0 31.831
             a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="rgba(148,163,184,0.25)"
          strokeWidth="3"
        />
        <motion.path
          d="M18 2.0845
             a 15.9155 15.9155 0 0 1 0 31.831
             a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: pct / 100 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className={scoreColor(clamped)}
        />
      </svg>

      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className={`text-2xl font-black ${scoreColor(clamped)}`}>
            {clamped}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
            /10
          </div>
        </div>
      </div>
    </div>
  );
};

export const AnalysisReport = ({
  finalAnalysis,
  marketState,
  onReset,
}: {
  finalAnalysis: FinalReportData;
  marketState: MarketState;
  onReset: () => void;
}) => {
  // Toast (replaces alert())
  const [toast, setToast] = useState<{ kind: ToastKind; message: string } | null>(
    null
  );

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  // Safe fallbacks (robust UI if model returns missing fields)
  const feasibilityScore = Number.isFinite(finalAnalysis?.feasibilityScore)
    ? finalAnalysis.feasibilityScore
    : 0;

  const verdict = finalAnalysis?.verdict ?? "No verdict returned.";
  const summary =
    finalAnalysis?.summary ?? "No summary returned by the model for this run.";
  const recommendation =
    finalAnalysis?.recommendation ??
    "No recommendation returned. Try running the simulation again.";

  const drivers: Driver[] = finalAnalysis?.successDrivers ?? [];
  const swot = finalAnalysis?.swot ?? {
    strengths: [],
    weaknesses: [],
    opportunities: [],
    threats: [],
  };

  const radarData = useMemo(() => {
    return (finalAnalysis?.comparison ?? []).map((c) => ({
      subject: c.attribute,
      User: c.user,
      Leader: c.leader,
      fullMark: 10,
    }));
  }, [finalAnalysis]);

  // Market Snapshot (uses your MarketState fields)
  const populationScale = marketState?.populationScale ?? 0;
  const visitsPerMonth = marketState?.visitsPerMonth ?? 0;
  const marketSentiment = marketState?.marketSentiment ?? 0;
  const volatility = marketState?.volatility ?? 0;
  const tick = marketState?.tick ?? 0;
  const maxTicks = marketState?.maxTicks ?? 0;
  const agentCount = marketState?.agents?.length ?? 0;
  const eventCount = marketState?.events?.length ?? 0;

  const sentimentLabel =
    marketSentiment >= 0.7
      ? "Positive"
      : marketSentiment >= 0.45
      ? "Neutral"
      : "Negative";

  const sentimentChip =
    marketSentiment >= 0.7
      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
      : marketSentiment >= 0.45
      ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
      : "bg-rose-500/10 border-rose-500/20 text-rose-300";

  const volatilityLabel =
    volatility >= 0.7 ? "High" : volatility >= 0.4 ? "Medium" : "Low";

  const volatilityChip =
    volatility >= 0.7
      ? "bg-rose-500/10 border-rose-500/20 text-rose-300"
      : volatility >= 0.4
      ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
      : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300";

  const badge =
    feasibilityScore >= 8
      ? {
          label: "High Confidence",
          cls: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
        }
      : feasibilityScore >= 5
      ? {
          label: "Moderate Signal",
          cls: "bg-amber-500/10 border-amber-500/20 text-amber-300",
        }
      : {
          label: "High Risk",
          cls: "bg-rose-500/10 border-rose-500/20 text-rose-300",
        };

  const handleCopySummary = async () => {
    const text = `Echelon AI Market Audit for ${
      marketState?.region ?? "Unknown Region"
    }: Viability Score ${feasibilityScore}/10. Verdict: ${verdict}.`;

    try {
      if (typeof navigator === "undefined" || !navigator.clipboard) {
        setToast({ kind: "error", message: "Clipboard not available here." });
        return;
      }
      await navigator.clipboard.writeText(text);
      setToast({ kind: "success", message: "Strategic summary copied." });
    } catch {
      setToast({ kind: "error", message: "Copy failed. Try again." });
    }
  };

  return (
    <div className="w-full text-white space-y-8 font-sans relative">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
          >
            <div
              className={`px-5 py-3 rounded-full shadow-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 ${toastStyles[toast.kind]}`}
            >
              <Sparkles className="w-4 h-4" />
              <span className="normal-case font-bold text-sm tracking-normal">
                {toast.message}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-indigo-900 via-slate-900 to-black p-10 sm:p-16 border border-slate-800 shadow-2xl"
      >
        {/* ambient blobs */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/20 blur-3xl rounded-full" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/15 blur-3xl rounded-full" />

        <div className="absolute -top-10 -right-10 opacity-10 pointer-events-none rotate-12">
          <img
            src="/logo.png"
            alt="Echelon Watermark"
            className="w-[500px] h-[500px] object-contain grayscale"
          />
        </div>

        <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-widest ${badge.cls}`}
            >
              <CheckCircle2 size={14} /> {badge.label}
            </div>

            <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
              {marketState?.region ?? "Unknown Region"}
            </h1>

            <p className="text-xl text-slate-400 max-w-lg leading-relaxed">
              Comprehensive AI feasibility analysis based on {tick} months of
              simulated market warfare.
            </p>

            {/* Market Snapshot */}
            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-black/35 backdrop-blur-xl p-4 rounded-2xl border border-white/10">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                  Market Snapshot
                </div>

                <div className="flex flex-wrap gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                    <Users size={14} className="text-slate-300" />
                    <span className="text-xs font-bold text-slate-200">
                      Pop Scale:{" "}
                      <span className="text-slate-400 font-extrabold">
                        {populationScale}
                      </span>
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                    <CalendarClock size={14} className="text-slate-300" />
                    <span className="text-xs font-bold text-slate-200">
                      Visits/mo:{" "}
                      <span className="text-slate-400 font-extrabold">
                        {visitsPerMonth}
                      </span>
                    </span>
                  </div>

                  <div
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border ${sentimentChip}`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                      Sentiment
                    </span>
                    <span className="text-xs font-extrabold">
                      {sentimentLabel} ({Math.round(marketSentiment * 100)}%)
                    </span>
                  </div>

                  <div
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border ${volatilityChip}`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                      Volatility
                    </span>
                    <span className="text-xs font-extrabold">
                      {volatilityLabel} ({Math.round(volatility * 100)}%)
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Agents
                    </span>
                    <span className="text-xs font-extrabold text-slate-200">
                      {agentCount}
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Events
                    </span>
                    <span className="text-xs font-extrabold text-slate-200">
                      {eventCount}
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Timeline
                    </span>
                    <span className="text-xs font-extrabold text-slate-200">
                      {tick}/{maxTicks}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-black/35 backdrop-blur-xl p-4 rounded-2xl border border-white/10">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                  Model Safety
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  This report uses simulated dynamics and AI-generated reasoning.
                  Treat outcomes as directional signals, not guaranteed
                  forecasts.
                </p>
              </div>
            </div>
          </div>

          {/* Header Stats */}
          <div className="flex flex-col sm:flex-row gap-6 items-start lg:justify-end">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.05 }}
              className={`bg-black/40 backdrop-blur-xl p-8 rounded-3xl border border-white/10 flex flex-col items-center min-w-[220px] ${scoreGlow(
                feasibilityScore
              )}`}
            >
              <span className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">
                Viability Score
              </span>
              <ScoreRing score={feasibilityScore} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.12 }}
              className="relative overflow-hidden bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 p-8 rounded-3xl flex flex-col justify-center max-w-xs shadow-[0_0_40px_-10px_rgba(16,185,129,0.4)]"
            >
              {/* shimmer blobs */}
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute -top-24 -left-24 w-56 h-56 rounded-full bg-white blur-3xl" />
                <motion.div
                  className="absolute -bottom-24 -right-24 w-56 h-56 rounded-full bg-white blur-3xl"
                  animate={{ x: [0, -10, 0], y: [0, 10, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>

              <div className="relative">
                <div className="font-bold uppercase tracking-widest text-[10px] mb-2 opacity-70">
                  Strategic Verdict
                </div>
                <div className="text-2xl font-black leading-tight">{verdict}</div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Comparison Radar */}
        <Card className="lg:col-span-1 min-h-[420px] flex flex-col">
          <h3 className="text-lg font-bold text-slate-300 flex items-center gap-2 mb-6">
            <Target size={18} className="text-indigo-400" /> Competitive Radar
          </h3>

          {radarData.length ? (
            <>
              <div className="flex-grow -ml-6">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: "bold" }}
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                    <Radar
                      name="You"
                      dataKey="User"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.28}
                    />
                    <Radar
                      name="Leader"
                      dataKey="Leader"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.10}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #1e293b",
                        borderRadius: "12px",
                      }}
                      itemStyle={{ fontSize: "12px", fontWeight: "bold" }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex justify-center gap-6 text-xs font-bold mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" /> Your Concept
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-500" /> Market Leader
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-slate-400 leading-relaxed">
              No comparison data returned for radar visualization.
            </div>
          )}
        </Card>

        {/* Executive Summary */}
        <Card className="lg:col-span-2 flex flex-col justify-center">
          <h3 className="text-lg font-bold text-slate-300 flex items-center gap-2 mb-6">
            <Activity size={18} className="text-amber-400" /> Strategic Breakdown
          </h3>

          <p className="text-lg text-slate-400 leading-relaxed mb-8">{summary}</p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
              <div className="text-xs font-bold text-slate-500 uppercase mb-1">
                Recommendation
              </div>
              <div className="text-slate-200 font-medium text-sm">
                {recommendation}
              </div>
            </div>

            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
              <div className="text-xs font-bold text-slate-500 uppercase mb-1">
                Market Opportunity
              </div>
              <div className="text-slate-200 font-medium text-sm">
                {drivers.length ? (
                  <>High demand for {drivers[0]?.factor ?? "innovation"}.</>
                ) : (
                  <>Opportunity signal not provided for this run.</>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Success Drivers */}
        <Card className="lg:col-span-1">
          <h3 className="text-lg font-bold text-slate-300 flex items-center gap-2 mb-6">
            <Zap size={18} className="text-yellow-400" /> Key Drivers
          </h3>

          {drivers.length ? (
            <div className="space-y-5">
              {drivers.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                    <span>{item.factor ?? `Driver ${i + 1}`}</span>
                    <span>{item.score ?? 0}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${item.score ?? 0}%` }}
                      transition={{ duration: 1, delay: i * 0.08 }}
                      className="h-full bg-gradient-to-r from-yellow-500 to-amber-600"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-slate-400 leading-relaxed">
              No success drivers returned. Try rerunning with a clearer idea and
              region.
            </div>
          )}
        </Card>

        {/* SWOT Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              title: "Strengths",
              icon: Shield,
              color: "text-emerald-300",
              items: swot?.strengths ?? [],
              bg: "bg-emerald-500/5",
              border: "border-emerald-500/20",
            },
            {
              title: "Weaknesses",
              icon: AlertTriangle,
              color: "text-rose-300",
              items: swot?.weaknesses ?? [],
              bg: "bg-rose-500/5",
              border: "border-rose-500/20",
            },
            {
              title: "Opportunities",
              icon: TrendingUp,
              color: "text-sky-300",
              items: swot?.opportunities ?? [],
              bg: "bg-sky-500/5",
              border: "border-sky-500/20",
            },
            {
              title: "Threats",
              icon: XCircle,
              color: "text-orange-300",
              items: swot?.threats ?? [],
              bg: "bg-orange-500/5",
              border: "border-orange-500/20",
            },
          ].map((s, i) => {
            const list = (s.items || []).slice(0, 2);
            return (
              <Card key={i} className={`${s.bg} ${s.border}`}>
                <h4 className={`font-bold flex items-center gap-2 mb-4 ${s.color}`}>
                  <s.icon size={16} /> {s.title}
                </h4>

                {list.length ? (
                  <ul className="space-y-2">
                    {list.map((item: string, idx: number) => (
                      <li
                        key={idx}
                        className="text-xs text-slate-300 flex items-start gap-2"
                      >
                        <span className="mt-1 w-1 h-1 rounded-full bg-slate-500 shrink-0" />{" "}
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-slate-400 leading-relaxed">
                    No {s.title.toLowerCase()} returned for this run.
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Action Plan (NEW) */}
        <Card className="lg:col-span-3">
          <h3 className="text-lg font-bold text-slate-300 flex items-center gap-2 mb-4">
            <Activity size={18} className="text-emerald-400" /> Action Plan (Next 3 Moves)
          </h3>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                title: "Validate Demand",
                text:
                  swot?.opportunities?.[0] ??
                  "Run 10 short interviews in-region to validate willingness-to-pay and urgency.",
              },
              {
                title: "De-risk Weakest Link",
                text:
                  swot?.weaknesses?.[0] ??
                  "Identify the biggest execution risk and design a cheap prototype test within 7 days.",
              },
              {
                title: "Outflank Competition",
                text:
                  swot?.threats?.[0] ??
                  "Define a wedge strategy that avoids direct leader competition for your first 60 days.",
              },
            ].map((x, i) => (
              <div
                key={i}
                className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800"
              >
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black mb-2">
                  Step {i + 1}
                </div>
                <div className="text-slate-200 font-black mb-2">{x.title}</div>
                <div className="text-sm text-slate-400 leading-relaxed">
                  {x.text}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 pt-10 border-t border-slate-800">
        <button
          onClick={onReset}
          className="flex-1 py-5 bg-white text-black rounded-[2rem] font-black flex items-center justify-center gap-3 hover:bg-slate-200 transition-all active:scale-[0.98] shadow-xl"
        >
          <RotateCcw size={20} /> Initialize New Innovation
        </button>

        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: "copy", icon: Share2, label: "Secure Link", color: "text-indigo-400" },
            { id: "mail", icon: MessageSquare, label: "Email Report", color: "text-blue-400" },
            { id: "word", icon: Database, label: "Word Doc", color: "text-emerald-400" },
            { id: "pdf", icon: FileText, label: "PDF Audit", color: "text-rose-400" },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => {
                if (btn.id === "copy") {
                  void handleCopySummary();
                } else {
                  setToast({
                    kind: "info",
                    message: `${btn.label} export is in alpha (hackathon build).`,
                  });
                }
              }}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-3xl border border-slate-800 transition-all hover:bg-white/5 group hover:border-slate-700/50 ${
                btn.id !== "copy" && "opacity-40"
              }`}
            >
              <btn.icon
                size={20}
                className={`${btn.color} group-hover:scale-125 transition-all duration-300`}
              />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors">
                {btn.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-slate-600 text-center uppercase tracking-[0.25em] pt-8 font-bold opacity-50">
        Strategic Intelligence Protocol • Gemini 2.0 Flash Simulation • Probabilistic Model Disclaimer Applied
      </p>
    </div>
  );
};
