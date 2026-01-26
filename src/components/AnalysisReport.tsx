
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
    Trophy, Activity, Target, Shield, Zap, TrendingUp, AlertTriangle,
    CheckCircle2, XCircle, ArrowRight, RotateCcw, Share2, Download
} from 'lucide-react';
import {
    ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    BarChart, Bar, XAxis, YAxis, Tooltip, Cell
} from 'recharts';
import { FinalReportData, MarketState } from '@/lib/gemini';

const scoreColor = (score: number) => {
    if (score >= 8) return 'text-emerald-500';
    if (score >= 5) return 'text-amber-500';
    return 'text-red-500';
};

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-3xl p-6 overflow-hidden ${className}`}
    >
        {children}
    </motion.div>
);

export const AnalysisReport = ({ finalAnalysis, marketState, onReset }: { finalAnalysis: FinalReportData, marketState: MarketState, onReset: () => void }) => {

    // Transform comparison data for Radar Chart
    const radarData = finalAnalysis.comparison.map(c => ({
        subject: c.attribute,
        User: c.user,
        Leader: c.leader,
        fullMark: 10,
    }));

    return (
        <div className="w-full text-white space-y-8 font-sans">
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-indigo-900 via-slate-900 to-black p-10 sm:p-16 border border-slate-800 shadow-2xl"
            >
                <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                    <Trophy size={400} />
                </div>

                <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest">
                            <CheckCircle2 size={14} /> Audit Complete
                        </div>
                        <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
                            {marketState.region}
                        </h1>
                        <p className="text-xl text-slate-400 max-w-lg leading-relaxed">
                            Comprehensive AI feasibility analysis based on {marketState.tick} months of simulated market warfare.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-6 items-start lg:justify-end">
                        <div className="bg-black/40 backdrop-blur-xl p-8 rounded-3xl border border-white/10 flex flex-col items-center min-w-[200px]">
                            <span className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Viability Score</span>
                            <div className={`text-6xl font-black ${scoreColor(finalAnalysis.feasibilityScore)}`}>{finalAnalysis.feasibilityScore}<span className="text-2xl text-slate-600">/10</span></div>
                        </div>
                        <div className="bg-emerald-500 text-slate-950 p-8 rounded-3xl flex flex-col justify-center max-w-xs shadow-[0_0_40px_-10px_rgba(16,185,129,0.4)]">
                            <div className="font-bold uppercase tracking-widest text-[10px] mb-2 opacity-60">Strategic Verdict</div>
                            <div className="text-2xl font-black leading-tight">{finalAnalysis.verdict}</div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Main Grid */}
            <div className="grid lg:grid-cols-3 gap-8">

                {/* Comparison Radar */}
                <Card className="lg:col-span-1 min-h-[400px] flex flex-col">
                    <h3 className="text-lg font-bold text-slate-300 flex items-center gap-2 mb-6"><Target size={18} className="text-indigo-500" /> Competitive Radar</h3>
                    <div className="flex-grow -ml-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                <PolarGrid stroke="#334155" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                                <Radar name="You" dataKey="User" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                                <Radar name="Leader" dataKey="Leader" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-6 text-xs font-bold mt-4">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /> Your Concept</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500" /> Market Leader</div>
                    </div>
                </Card>

                {/* Executive Summary */}
                <Card className="lg:col-span-2 flex flex-col justify-center">
                    <h3 className="text-lg font-bold text-slate-300 flex items-center gap-2 mb-6"><Activity size={18} className="text-amber-500" /> Strategic Breakdown</h3>
                    <p className="text-lg text-slate-400 leading-relaxed mb-8">{finalAnalysis.summary}</p>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                            <div className="text-xs font-bold text-slate-500 uppercase mb-1">Recommendation</div>
                            <div className="text-slate-200 font-medium text-sm">{finalAnalysis.recommendation}</div>
                        </div>
                        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                            <div className="text-xs font-bold text-slate-500 uppercase mb-1">Market Opportunity</div>
                            <div className="text-slate-200 font-medium text-sm">High demand for {finalAnalysis.successDrivers[0]?.factor || 'innovation'}.</div>
                        </div>
                    </div>
                </Card>

                {/* Success Drivers */}
                <Card className="lg:col-span-1">
                    <h3 className="text-lg font-bold text-slate-300 flex items-center gap-2 mb-6"><Zap size={18} className="text-yellow-500" /> Key Drivers</h3>
                    <div className="space-y-5">
                        {finalAnalysis.successDrivers.map((item, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                                    <span>{item.factor}</span>
                                    <span>{item.score}%</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${item.score}%` }}
                                        transition={{ duration: 1, delay: i * 0.1 }}
                                        className="h-full bg-gradient-to-r from-yellow-500 to-amber-600"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* SWOT Grid */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                        { title: 'Strengths', icon: Shield, color: 'text-emerald-400', items: finalAnalysis.swot.strengths, bg: 'bg-emerald-500/5', border: 'border-emerald-500/20' },
                        { title: 'Weaknesses', icon: AlertTriangle, color: 'text-red-400', items: finalAnalysis.swot.weaknesses, bg: 'bg-red-500/5', border: 'border-red-500/20' },
                        { title: 'Opportunities', icon: TrendingUp, color: 'text-blue-400', items: finalAnalysis.swot.opportunities, bg: 'bg-blue-500/5', border: 'border-blue-500/20' },
                        { title: 'Threats', icon: XCircle, color: 'text-orange-400', items: finalAnalysis.swot.threats, bg: 'bg-orange-500/5', border: 'border-orange-500/20' },
                    ].map((s, i) => (
                        <Card key={i} className={`${s.bg} ${s.border}`}>
                            <h4 className={`font-bold flex items-center gap-2 mb-4 ${s.color}`}>
                                <s.icon size={16} /> {s.title}
                            </h4>
                            <ul className="space-y-2">
                                {s.items.slice(0, 2).map((item, idx) => (
                                    <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                                        <span className="mt-1 w-1 h-1 rounded-full bg-slate-500 shrink-0" /> {item}
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    ))}
                </div>

            </div>

            <div className="flex gap-4 pt-8 border-t border-slate-800">
                <button onClick={onReset} className="flex-1 py-4 bg-white text-black rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors">
                    <RotateCcw size={18} /> New Innovation
                </button>
                <button className="px-8 py-4 bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors">
                    <Share2 size={18} /> Share Report
                </button>
            </div>
        </div>
    );
};
