
"use client";

import React from 'react';
import { RotateCcw, Trophy, Activity, MessageSquare, HelpCircle } from 'lucide-react';
import { FinalReportData } from '@/lib/gemini';
import { MarketState } from '@/lib/types';

export const AnalysisReport = ({ finalAnalysis, marketState, onReset }: { finalAnalysis: FinalReportData, marketState: MarketState, onReset: () => void }) => {
    return (
        <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 border shadow-lg max-w-5xl mx-auto space-y-12">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b pb-8">
                <div>
                    <div className="text-emerald-600 font-bold uppercase tracking-widest text-[10px] mb-2">Detailed Feasibility Study</div>
                    <h1 className="text-4xl font-heading font-black">{marketState.region} Market Audit</h1>
                </div>
                <div className="bg-slate-900 text-white px-8 py-6 rounded-2xl flex flex-col items-center">
                    <div className="text-3xl font-black">{finalAnalysis.feasibilityScore}/10</div>
                    <div className="text-[10px] uppercase font-bold tracking-widest opacity-60">Viability Score</div>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                    <h3 className="text-xl font-bold font-heading">Executive Summary</h3>
                    <p className="text-slate-600 leading-relaxed text-lg">{finalAnalysis.summary}</p>
                </div>
                <div className="bg-slate-50 p-8 rounded-2xl border space-y-4">
                    <h3 className="text-sm font-bold font-heading uppercase tracking-widest text-slate-400">Strategic Verdict</h3>
                    <div className="text-3xl font-bold text-slate-900">{finalAnalysis.verdict}</div>
                    <p className="text-slate-500">{finalAnalysis.recommendation}</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white border rounded-2xl p-6">
                    <h4 className="font-bold mb-6 flex items-center gap-2"><Trophy size={16} /> Success Drivers</h4>
                    <div className="space-y-4">
                        {finalAnalysis.successDrivers.map((d, i) => (
                            <div key={i} className="space-y-1">
                                <div className="flex justify-between text-xs font-bold"><span>{d.factor}</span><span>{d.score}%</span></div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div style={{ width: `${d.score}%` }} className="h-full bg-emerald-500" /></div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white border rounded-2xl p-6">
                    <h4 className="font-bold mb-6 flex items-center gap-2"><Activity size={16} /> SWOT Analysis</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                        <div><strong className="text-emerald-600 block mb-1">Strength</strong>{finalAnalysis.swot.strengths[0]}</div>
                        <div><strong className="text-red-500 block mb-1">Weakness</strong>{finalAnalysis.swot.weaknesses[0]}</div>
                        <div><strong className="text-blue-500 block mb-1">Opportunity</strong>{finalAnalysis.swot.opportunities[0]}</div>
                        <div><strong className="text-amber-500 block mb-1">Threat</strong>{finalAnalysis.swot.threats[0]}</div>
                    </div>
                </div>
            </div>

            <button onClick={onReset} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90"><RotateCcw size={16} /> Start New Simulation</button>
        </div>
    );
};
