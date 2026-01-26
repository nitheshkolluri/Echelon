
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play, Pause, RotateCcw, TrendingUp, DollarSign, Activity,
    BrainCircuit, Info, Globe, ArrowRight,
    Menu, RefreshCcw, BarChart3, HelpCircle, MessageSquare, Database,
    Trophy, MapPin, Building2
} from 'lucide-react';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';

import { Agent, MarketState } from '@/lib/types';
import { analyzeIdeaAndCreateMarket, getStrategicIntervention, generateFinalAnalysis, FinalReportData } from '@/lib/gemini';
import { runSimulationTick, applyGeminiUpdates } from '@/lib/simulation';
import { Sidebar } from '@/components/Sidebar';
import { AnalysisReport } from '@/components/AnalysisReport';

const COLORS = ['#0f172a', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

const App: React.FC = () => {
    const [view, setView] = useState<'landing' | 'setup' | 'simulation' | 'analysis'>('landing');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [idea, setIdea] = useState('');
    const [region, setRegion] = useState('');
    const [population, setPopulation] = useState(20000);
    const [sentiment, setSentiment] = useState(0.65);
    const [isLoading, setIsLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isRetrying, setIsRetrying] = useState(false);
    const [analysisStep, setAnalysisStep] = useState(0);
    const [isSimulating, setIsSimulating] = useState(false);
    const [marketState, setMarketState] = useState<MarketState | null>(null);
    // Use state for logs if we were displaying them, currently we derive them from simulation but we can add simple array state if needed
    // In original code there was logs state. I'll add it back.
    const [logs, setLogs] = useState<string[]>([]);

    const [finalAnalysis, setFinalAnalysis] = useState<FinalReportData | null>(null);
    const [errorToast, setErrorToast] = useState<string | null>(null);
    const simIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const analysisSteps = ["Gathering regional data...", "Benchmarking competitors...", "Analyzing loyalty shifts...", "Simulating scalability...", "Synthesizing logic..."];

    const handleLaunchModel = async () => {
        if (!idea.trim() || !region.trim()) return;
        setIsLoading(true); setErrorToast(null);
        try {
            const { agents, marketContext } = await analyzeIdeaAndCreateMarket(idea, region);
            const initializedAgents: Agent[] = (agents || []).map((a, i) => ({
                ...a,
                id: a.role === 'startup' ? 'USER_ID' : `COMP-${i + 1}`,
                currentPricing: a.basePricing || 10,
                marketShare: 1 / (agents?.length || 1),
                revenue: 0, profit: 0, growthRate: 0, history: [], reasoning: 'Init'
            } as Agent));
            setMarketState({ region, populationScale: population, visitsPerMonth: marketContext.visitsPerMonth || 4, marketSentiment: sentiment, volatility: 0.05, tick: 0, maxTicks: 36, agents: initializedAgents, events: [] });
            setView('simulation');
        } catch (e: any) {
            setErrorToast(e?.message?.includes('429') ? "Throttled. Retrying..." : "Init Error.");
            console.error(e);
        } finally { setIsLoading(false); }
    };

    const handleSimTick = useCallback(() => {
        setMarketState((prev: MarketState | null) => {
            if (!prev || prev.tick >= prev.maxTicks) { setIsSimulating(false); return prev; }
            if (prev.tick > 0 && prev.tick % 6 === 0) triggerExpertInput(prev);
            const nextState = runSimulationTick(prev);
            // Optional: Populate logs based on events or significant changes
            // For now we just push events if any
            return nextState;
        });
    }, []);

    const triggerExpertInput = async (currentState: MarketState) => {
        try {
            const response = await getStrategicIntervention(currentState);
            setMarketState(prev => {
                if (!prev) return null;
                let newState = applyGeminiUpdates(prev, response.updates);
                if (response.marketEvent) {
                    newState.events.push({ tick: prev.tick, ...response.marketEvent });
                    setLogs(l => [...l, `[M${prev.tick}] ${response.marketEvent!.title}`]);
                }

                // Add reasoning logs
                response.updates.forEach(u => {
                    const agent = newState.agents.find(a => a.id === u.agentId);
                    if (agent) setLogs(l => [...l, `[M${prev.tick}] ${agent.name}: ${u.reasoning.substring(0, 40)}...`]);
                });

                return newState;
            });
        } catch (e) { }
    };

    useEffect(() => {
        if (isSimulating) simIntervalRef.current = setInterval(handleSimTick, 150);
        else if (simIntervalRef.current) clearInterval(simIntervalRef.current);
        return () => { if (simIntervalRef.current) clearInterval(simIntervalRef.current); };
    }, [isSimulating, handleSimTick]);

    const handleReportGeneration = async () => {
        if (!marketState) return;
        setIsAnalyzing(true); setAnalysisStep(0);
        const stepInterval = setInterval(() => setAnalysisStep(p => p < analysisSteps.length - 1 ? p + 1 : p), 1500);
        try {
            const analysis = await generateFinalAnalysis(marketState);
            setFinalAnalysis(analysis); setView('analysis');
        } catch (e: any) {
            if (e?.message?.includes('429')) setIsRetrying(true);
        } finally { clearInterval(stepInterval); setIsAnalyzing(false); setIsRetrying(false); }
    };

    const reset = () => { setView('landing'); setMarketState(null); setIdea(''); setRegion(''); setLogs([]); setFinalAnalysis(null); setErrorToast(null); };

    const getWinner = () => marketState ? [...marketState.agents].sort((a, b) => b.marketShare - a.marketShare)[0] : null;

    return (
        <div className="flex h-screen w-full bg-slate-50 text-slate-900 overflow-hidden font-sans">
            <Sidebar activeView={view} onViewChange={setView} isOpen={isSidebarOpen} toggle={() => setIsSidebarOpen(!isSidebarOpen)} />
            <main className="flex-grow flex flex-col relative overflow-hidden">
                {errorToast && (
                    <motion.div initial={{ y: -50 }} animate={{ y: 20 }} className="absolute top-4 left-1/2 -translate-x-1/2 z-[110] bg-slate-900 text-white px-6 py-2 rounded-xl shadow-2xl flex items-center gap-2">
                        <RefreshCcw className="animate-spin" size={14} /><span className="text-[10px] font-bold uppercase">{errorToast}</span>
                    </motion.div>
                )}
                <div className="lg:hidden h-16 border-b bg-white flex items-center px-6 justify-between z-40">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600"><Menu size={24} /></button>
                    <h1 className="font-heading font-bold text-lg">ECHELON</h1><div className="w-8" />
                </div>
                <AnimatePresence>
                    {isAnalyzing && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-white/95 backdrop-blur-xl z-[100] flex flex-col items-center justify-center p-6 text-center">
                            <div className="w-20 h-20 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin mb-8" />
                            <div className="space-y-2 max-w-sm w-full">
                                <h3 className="text-2xl font-heading font-bold">{isRetrying ? "Retrying API..." : "Finalizing Report"}</h3>
                                <div className="h-1 bg-slate-100 rounded-full overflow-hidden"><motion.div animate={{ width: `${(analysisStep + 1) * 20}%` }} className="h-full bg-emerald-500" /></div>
                                <p className="text-slate-500 text-sm">{analysisSteps[analysisStep]}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    {view === 'landing' && (
                        <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-grow flex flex-col items-center justify-center p-6 text-center">
                            <div className="w-20 h-20 bg-slate-900 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-2xl"><Building2 size={36} className="text-white" /></div>
                            <h1 className="text-4xl sm:text-6xl font-heading font-bold tracking-tight mb-6">Strategic Feasibility</h1>
                            <p className="text-slate-500 max-w-xl text-lg mb-10 leading-relaxed">Simulate localized market dynamics. Build against real incumbents. Evolve your strategy with Gemini-powered logic.</p>
                            <button onClick={() => setView('setup')} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center gap-3">Start Engine <ArrowRight size={18} /></button>
                        </motion.div>
                    )}
                    {view === 'setup' && (
                        <motion.div key="setup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-grow flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
                            <div className="max-w-4xl w-full bg-white p-8 sm:p-12 rounded-[2.5rem] shadow-sm border border-slate-200 grid lg:grid-cols-2 gap-12">
                                <div className="space-y-8">
                                    <h2 className="text-3xl font-heading font-bold">Market Entry</h2>
                                    <div className="space-y-4">
                                        <div className="space-y-2"><label className="text-xs font-bold uppercase text-slate-500">Region</label><input type="text" value={region} onChange={e => setRegion(e.target.value)} placeholder="e.g. Austin, Texas" className="w-full bg-slate-50 border rounded-xl px-5 py-3 outline-none focus:ring-2 focus:ring-slate-900" /></div>
                                        <div className="space-y-2"><label className="text-xs font-bold uppercase text-slate-500">Business Concept</label><textarea value={idea} onChange={e => setIdea(e.target.value)} placeholder="A premium coffee roastery..." className="w-full h-32 bg-slate-50 border rounded-xl p-5 outline-none resize-none focus:ring-2 focus:ring-slate-900" /></div>
                                    </div>
                                    <button onClick={handleLaunchModel} disabled={isLoading || !idea || !region} className="w-full bg-slate-900 py-4 rounded-xl text-white font-bold disabled:opacity-50 flex items-center justify-center gap-3">{isLoading ? <Activity className="animate-spin" /> : <><Globe size={20} /> Initialize Environment</>}</button>
                                </div>
                                <div className="space-y-8 bg-slate-50/50 p-8 rounded-3xl border">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Scalars</h3>
                                    <div className="space-y-6">
                                        <div className="space-y-2"><div className="flex justify-between text-xs font-bold"><span>Population</span><span>{(population / 1000).toFixed(0)}k</span></div><input type="range" min="1000" max="500000" step="1000" value={population} onChange={e => setPopulation(Number(e.target.value))} className="w-full accent-slate-900" /></div>
                                        <div className="space-y-2"><div className="flex justify-between text-xs font-bold"><span>Sentiment</span><span>{(sentiment * 100).toFixed(0)}%</span></div><input type="range" min="0" max="1" step="0.05" value={sentiment} onChange={e => setSentiment(Number(e.target.value))} className="w-full accent-slate-900" /></div>
                                    </div>
                                    <div className="p-5 bg-white rounded-xl border flex gap-3"><Info size={20} className="text-slate-300 flex-shrink-0" /><p className="text-[11px] text-slate-500 leading-normal font-medium">Simulation uses regional density to calculate transaction frequency and competitive pressure.</p></div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {view === 'simulation' && marketState && (
                        <motion.div key="simulation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-grow flex flex-col p-6 sm:p-10 overflow-y-auto">
                            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-6 border-b gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest"><MapPin size={12} /> {marketState.region}</div>
                                    <h2 className="text-3xl font-heading font-bold">Active Simulation</h2>
                                    <p className="text-slate-400 font-bold text-sm">Month {marketState.tick} / {marketState.maxTicks}</p>
                                </div>
                                <div className="flex gap-4 w-full sm:w-auto">
                                    <button onClick={() => setIsSimulating(!isSimulating)} className={`flex-grow px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isSimulating ? 'bg-slate-100 text-slate-900' : 'bg-slate-900 text-white'}`}>{isSimulating ? <Pause size={18} /> : <Play size={18} />}{isSimulating ? "Pause" : "Start"}</button>
                                    {marketState.tick >= marketState.maxTicks && <button onClick={handleReportGeneration} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg"><BarChart3 size={18} /> Final Audit</button>}
                                    <button onClick={reset} className="p-3 bg-white border rounded-xl"><RotateCcw size={18} /></button>
                                </div>
                            </header>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                {[{ label: 'Leader', val: getWinner()?.name || '-', icon: Trophy }, { label: 'Total Rev', val: `$${(marketState.agents.reduce((s, a) => s + a.revenue, 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: DollarSign }, { label: 'Sentiment', val: `${(marketState.marketSentiment * 100).toFixed(0)}%`, icon: TrendingUp }, { label: 'Velocity', val: marketState.tick < 12 ? 'Scaling' : 'Steady', icon: Activity }].map((s, i) => (
                                    <div key={i} className="bg-white p-6 rounded-2xl border shadow-sm">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><s.icon size={12} />{s.label}</div>
                                        <div className="text-xl font-black truncate">{s.val}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="grid lg:grid-cols-3 gap-8 mb-8 flex-grow min-h-0">
                                <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border flex flex-col">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Activity size={14} /> Market Share Projection</h4>
                                    <div className="flex-grow min-h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={Array.from({ length: marketState.tick }, (_, t) => {
                                                const d: any = { tick: t };
                                                marketState.agents.forEach(a => { d[a.name] = (a.history.find(h => h.tick === t)?.share || 0) * 100; });
                                                return d;
                                            })}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                                <XAxis dataKey="tick" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                                                <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                                {marketState.agents.map((a, i) => (<Area key={a.id} type="monotone" dataKey={a.name} stackId="1" stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.1} strokeWidth={2.5} />))}
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="bg-slate-900 rounded-[2rem] p-6 text-white flex flex-col">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Database size={14} /> System Logic</h4>
                                    <div className="flex-grow overflow-y-auto font-mono text-[10px] space-y-3 opacity-80">
                                        {logs.slice(-8).reverse().map((l, i) => (<div key={i} className="p-3 bg-white/5 rounded-lg border border-white/5">{">>>"} {l}</div>))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {view === 'analysis' && finalAnalysis && marketState && (
                        <motion.div key="analysis" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-grow flex flex-col p-6 sm:p-12 overflow-y-auto">
                            <AnalysisReport finalAnalysis={finalAnalysis} marketState={marketState} onReset={reset} />
                        </motion.div>
                    )}
                </AnimatePresence>
                <footer className="h-12 border-t bg-white px-8 flex items-center justify-between text-[10px] font-bold text-slate-400 z-40 shrink-0">
                    <div className="flex items-center gap-6 uppercase tracking-widest">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> ECHELON OS</div>
                        <div className="hidden sm:block">Env: {marketState?.region || 'STANDBY'}</div>
                    </div>
                    <div className="flex items-center gap-6">
                        <HelpCircle size={14} /><MessageSquare size={14} />
                        <span className="bg-slate-50 px-4 py-1 rounded-full border">PLATINUM v4.2.1-ELITE</span>
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default App;
