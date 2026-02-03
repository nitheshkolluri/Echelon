"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play, Pause, RotateCcw, TrendingUp, DollarSign, Activity,
    BrainCircuit, Info, Globe, ArrowRight,
    Menu, RefreshCcw, BarChart3, HelpCircle, MessageSquare, Database,
    Trophy, MapPin, Building2, Terminal, User as UserIcon, LogOut, Zap, Shield,
    History as HistoryIcon, Settings, Users
} from 'lucide-react';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';

import type { Agent, MarketState } from '@/lib/types';
import { authApi, simulationApi, reportApi } from '@/lib/api';
import type { FinalReportData } from '@/lib/reportTypes';
import { Sidebar } from '@/components/Sidebar';
import { AnalysisReport } from '@/components/AnalysisReport';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'];

const App: React.FC = () => {
    // Guest User State (Auth removed per requirements)
    const [user, setUser] = useState<any>({
        name: 'Explorer',
        tier: 'HACKATHON',
        email: 'guest@echelon.ai'
    });
    const [token, setToken] = useState<string | null>("guest-token");
    const [isCheckingAuth, setIsCheckingAuth] = useState(false);

    // Navigation/View State
    const [view, setView] = useState<'landing' | 'setup' | 'simulation' | 'analysis' | 'history' | 'lab' | 'gemini' | 'account'>('landing');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    // Simulation Config
    const [idea, setIdea] = useState('');
    const [region, setRegion] = useState('');
    const [population, setPopulation] = useState(20000);
    const [sentiment, setSentiment] = useState(0.65);
    const [duration, setDuration] = useState(24);

    // Simulation Running State
    const [isLoading, setIsLoading] = useState(false);
    const [simulationId, setSimulationId] = useState<string | null>(null);
    const [marketState, setMarketState] = useState<MarketState | null>(null);
    const [finalAnalysis, setFinalAnalysis] = useState<FinalReportData | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [progress, setProgress] = useState(0);
    const [errorToast, setErrorToast] = useState<string | null>(null);
    const [history, setHistory] = useState<any[]>([]);

    const [mounted, setMounted] = useState(false);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Initial load and history recovery
    useEffect(() => {
        setMounted(true);
        const savedHistory = localStorage.getItem('echelon_history');
        if (savedHistory) {
            try {
                setHistory(JSON.parse(savedHistory));
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        }
    }, []);

    const saveToHistory = (market: MarketState, report: FinalReportData) => {
        const newEntry = {
            id: simulationId || Date.now().toString(),
            date: new Date().toISOString(),
            idea,
            region,
            marketState: market,
            report: report
        };
        const updatedHistory = [newEntry, ...history].slice(0, 10);
        setHistory(updatedHistory);
        localStorage.setItem('echelon_history', JSON.stringify(updatedHistory));
    };

    const logWithTimestamp = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString().split(' ')[0]}] ${msg}`, ...prev].slice(0, 50));
    };

    const startSimulation = async () => {
        if (!idea.trim() || !region.trim()) return;
        setIsLoading(true);
        setErrorToast(null);
        setLogs([]);
        setProgress(0);

        try {
            logWithTimestamp("Requesting Gemini to architect simulation environment...");
            const response = await simulationApi.create({
                idea,
                region,
                population,
                sentiment,
                duration
            });

            const { simulationId: sid } = response.data;
            setSimulationId(sid);
            setView('simulation');

            // Start polling for simulation status
            pollSimulationStatus(sid);
        } catch (e: any) {
            setErrorToast(e.message || "Failed to start simulation");
            setIsLoading(false);
        }
    };

    const pollSimulationStatus = (id: string) => {
        if (pollingRef.current) clearInterval(pollingRef.current);

        pollingRef.current = setInterval(async () => {
            try {
                const response = await simulationApi.get(id);
                const sim = response.data;

                setProgress(sim.progress);

                if (sim.status === 'RUNNING' || sim.status === 'PENDING') {
                    // Still running
                    logWithTimestamp(`Simulation progressing: ${sim.progress}%`);
                } else if (sim.status === 'COMPLETED') {
                    clearInterval(pollingRef.current!);
                    setMarketState(sim.marketState);
                    setFinalAnalysis(sim.report);
                    saveToHistory(sim.marketState, sim.report);
                    logWithTimestamp("✅ Simulation completed successfully.");
                    setIsLoading(false);
                    // Give a small delay for UX before switching to analysis
                    setTimeout(() => setView('analysis'), 1500);
                } else if (sim.status === 'FAILED') {
                    clearInterval(pollingRef.current!);
                    setErrorToast("Simulation engine encountered an error.");
                    setIsLoading(false);
                }
            } catch (err) {
                console.error("Polling error:", err);
            }
        }, 2000);
    };

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, []);

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex font-[Outfit,sans-serif] selection:bg-indigo-500/30 selection:text-indigo-200">
            <Sidebar
                isOpen={isSidebarOpen}
                toggle={() => setIsSidebarOpen(!isSidebarOpen)}
                user={user}
                currentView={view}
                onNavigate={(v) => setView(v)}
            />

            <main className="flex-1 flex flex-col min-w-0 md:ml-20 overflow-hidden">
                {/* Header */}
                <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 backdrop-blur-md bg-black/50 sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 hover:bg-white/5 rounded-lg md:hidden"
                        >
                            <Menu className="w-5 h-5" />
                        </motion.button>
                        <div className="flex items-center gap-3">
                            <div className="md:hidden w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                                <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
                            </div>
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                {view === 'landing' ? 'Mission Control' : view.replace('-', ' ')}
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-xs font-black tracking-widest text-white uppercase">{user.name}</span>
                            <div className="flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-tighter">Verified Researcher</span>
                            </div>
                        </div>
                        <div
                            onClick={() => setView('account')}
                            className="w-10 h-10 rounded-xl bg-[#121212] flex items-center justify-center border border-white/10 hover:border-indigo-500/50 cursor-pointer transition-all active:scale-95 group"
                        >
                            <img src="/logo.png" alt="Profile" className="w-6 h-6 object-contain grayscale group-hover:grayscale-0 transition-all" />
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {view === 'landing' && (
                            <motion.div
                                key="landing"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className="max-w-4xl mx-auto px-6 py-20"
                            >
                                <div className="text-center mb-16">
                                    <h1 className="text-6xl font-black mb-6 bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent leading-tight">
                                        Test your vision <br /> against the market.
                                    </h1>
                                    <p className="text-xl text-gray-400 max-w-2xl mx-auto font-medium">
                                        Inject your idea into a living, Gemini-powered simulation. Watch competitors adapt, prices shift, and strategy unfold in real-time.
                                    </p>
                                </div>

                                <div className="bg-[#121212] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 text-gray-800 opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity">
                                        <BrainCircuit size={180} />
                                    </div>

                                    <div className="relative z-10 space-y-10">
                                        <div>
                                            <label className="text-xs font-bold text-indigo-400 uppercase tracking-[0.2em] mb-4 block">1. The Concept</label>
                                            <textarea
                                                value={idea}
                                                onChange={(e) => setIdea(e.target.value)}
                                                placeholder="e.g., A subscription-based health tech platform for seniors in rural India..."
                                                className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-xl text-white placeholder:text-gray-700 min-h-[140px] focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none"
                                            />
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-8">
                                            <div>
                                                <label className="text-xs font-bold text-indigo-400 uppercase tracking-[0.2em] mb-4 block">2. Target Region</label>
                                                <div className="relative">
                                                    <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                                    <input
                                                        value={region}
                                                        onChange={(e) => setRegion(e.target.value)}
                                                        placeholder="South Bangalore"
                                                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white placeholder:text-gray-700 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-indigo-400 uppercase tracking-[0.2em] mb-4 block">3. Duration (Months)</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={duration}
                                                        onChange={(e) => setDuration(parseInt(e.target.value))}
                                                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 px-6 text-white focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={startSimulation}
                                            disabled={isLoading || !idea || !region}
                                            className="w-full bg-white text-black font-black py-6 rounded-3xl hover:bg-gray-200 transition-all transform active:scale-95 flex items-center justify-center gap-3 text-lg disabled:opacity-50"
                                        >
                                            {isLoading ? (
                                                <div className="w-6 h-6 border-4 border-black/10 border-t-black rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    Initialize Simulation Environment
                                                    <ArrowRight className="w-6 h-6" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {view === 'simulation' && (
                            <motion.div
                                key="simulation"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-6 h-full flex flex-col gap-6 overflow-hidden"
                            >
                                {/* Simulation view content - can keep previous charts logic but with progress bar */}
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-2xl font-bold flex items-center gap-3">
                                        <Terminal className="text-emerald-400" />
                                        Simulation in Progress
                                    </h2>
                                    <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-bold animate-pulse">
                                        ACTIVE LIVE NODE
                                    </div>
                                </div>

                                <div className="w-full bg-white/5 rounded-full h-4 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                                    />
                                </div>

                                <div className="grid lg:grid-cols-3 gap-6 flex-1 min-h-0">
                                    <div className="lg:col-span-2 bg-[#121212] rounded-[2rem] border border-white/10 p-8 flex flex-col">
                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className="text-lg font-bold flex items-center gap-2">
                                                <Activity className="text-indigo-400" />
                                                Market Share Evolution
                                            </h3>
                                        </div>

                                        <div className="flex-1 w-full min-h-[300px]">
                                            {marketState ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={marketState.agents[0].history}>
                                                        {marketState.agents.map((agent, i) => (
                                                            <Area
                                                                key={agent.id}
                                                                type="monotone"
                                                                dataKey={`share`}
                                                                // This part needs adjustment to show all agents in one chart data if needed
                                                                stroke={COLORS[i % COLORS.length]}
                                                                fill={COLORS[i % COLORS.length]}
                                                                fillOpacity={0.1}
                                                            />
                                                        ))}
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-gray-500 italic">
                                                    Constructing market models...
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-[#121212] rounded-[2rem] border border-white/10 flex flex-col overflow-hidden">
                                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                                            <h3 className="font-bold flex items-center gap-2 text-sm tracking-widest uppercase">
                                                <Database className="w-4 h-4 text-emerald-400" />
                                                Event Logs
                                            </h3>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
                                            {logs.map((log, i) => (
                                                <motion.div
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    key={i}
                                                    className="p-3 bg-black/40 border border-white/5 rounded-xl text-gray-400 leading-relaxed"
                                                >
                                                    <span className="text-emerald-500 mr-2">➜</span>
                                                    {log}
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {view === 'analysis' && marketState && finalAnalysis && (
                            <motion.div
                                key="analysis"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-6 max-w-7xl mx-auto w-full"
                            >
                                <AnalysisReport
                                    finalAnalysis={finalAnalysis}
                                    marketState={marketState}
                                    onReset={() => setView('landing')}
                                />
                            </motion.div>
                        )}

                        {view === 'history' && (
                            <motion.div
                                key="history"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="max-w-5xl mx-auto px-6 py-20"
                            >
                                <div className="flex items-center justify-between mb-12">
                                    <div>
                                        <h1 className="text-4xl font-black mb-2">Simulation Vault</h1>
                                        <p className="text-gray-400">Review your past market experiments and strategic outcomes.</p>
                                    </div>
                                    <button
                                        onClick={() => { setHistory([]); localStorage.removeItem('echelon_history'); }}
                                        className="text-xs font-bold text-red-500/50 hover:text-red-500 transition-colors uppercase tracking-widest"
                                    >
                                        Clear Vault
                                    </button>
                                </div>

                                {history.length > 0 ? (
                                    <div className="grid gap-4">
                                        {history.map((sim, i) => (
                                            <div
                                                key={i}
                                                onClick={() => {
                                                    setIdea(sim.idea);
                                                    setRegion(sim.region);
                                                    setMarketState(sim.marketState);
                                                    setFinalAnalysis(sim.report);
                                                    setView('analysis');
                                                }}
                                                className="p-6 bg-[#121212] border border-white/10 rounded-3xl hover:border-indigo-500/50 transition-all cursor-pointer group flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-6">
                                                    <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors">
                                                        <Activity className="text-indigo-400 w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg group-hover:text-indigo-400 transition-colors">{sim.region}</h3>
                                                        <p className="text-sm text-gray-500 line-clamp-1 max-w-md">{sim.idea}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xl font-black text-emerald-400">{sim.report.feasibilityScore}/10</div>
                                                    <div className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">
                                                        {new Date(sim.date).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-[#121212] border border-white/10 rounded-[2rem] p-12 text-gray-600 italic text-center">
                                        No simulations recorded in this session. Start your first venture to build history.
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {view === 'lab' && (
                            <motion.div
                                key="lab"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="max-w-5xl mx-auto px-6 py-20"
                            >
                                <div className="flex items-center gap-6 mb-12">
                                    <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shrink-0">
                                        <BarChart3 className="text-emerald-400 w-8 h-8" />
                                    </div>
                                    <div>
                                        <h1 className="text-4xl font-black">Market Lab</h1>
                                        <p className="text-gray-400">Advanced diagnostic tools for deep-tier market hypothesis testing.</p>
                                    </div>
                                </div>

                                <div className="mb-12 p-6 bg-indigo-500/5 border border-indigo-500/20 rounded-3xl">
                                    <div className="flex items-start gap-4">
                                        <Info className="text-indigo-400 shrink-0 mt-1" size={20} />
                                        <p className="text-sm text-indigo-300 leading-relaxed">
                                            <strong>Hackathon Showcase Mode:</strong> The Market Lab demonstrates Echelon's potential for enterprise-grade diagnostics. While the core simulation handles standard market dynamics, these Lab modules are currently in tech-demo status to showcase the planned roadmap for high-frequency trading and psychological consumer profiling features.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    {[
                                        { title: 'Sentiment Sandbox', desc: 'Simulate extreme shifts in consumer confidence and social media movements.' },
                                        { title: 'Competitor Archetypes', desc: 'Design custom AI agents with specific strategic biases and budget constraints.' },
                                        { title: 'Global Shock Sim', desc: 'Test resilience against simulated supply chain crises or economic shocks.' },
                                        { title: 'Niche Deep-Dive', desc: 'Analyze micro-segments within larger regional markets for targeted entries.' }
                                    ].map((item, i) => (
                                        <div key={i} className="p-8 bg-white/5 border border-white/5 rounded-3xl group relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-4">
                                                <div className="px-2 py-1 bg-white/5 rounded text-[8px] font-black uppercase tracking-widest text-gray-500">Coming Soon</div>
                                            </div>
                                            <h3 className="font-bold mb-2 text-gray-300 transition-colors">{item.title}</h3>
                                            <p className="text-sm text-gray-500">{item.desc}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-20 pt-12 border-t border-white/5">
                                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-600 mb-8">AI Disclaimer & Ethics</h3>
                                    <div className="grid md:grid-cols-2 gap-12 text-xs text-gray-500 leading-relaxed">
                                        <p>
                                            Echelon leverages large language models (Gemini 2.0 Flash) to simulate complex human behaviors and strategic decisions. While highly sophisticated, these simulations are based on probabilistic modeling and should not be used as the sole basis for multi-million dollar capital investments without human professional consultation.
                                        </p>
                                        <p>
                                            All market data generated is synthetic and intended for strategic experimentation. Echelon does not store or process real-world consumer PII (Personally Identifiable Information) during its simulation cycles, adhering to strict data privacy standards for the Google Gemini 3 Hackathon.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {view === 'gemini' && (
                            <motion.div
                                key="gemini"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="max-w-4xl mx-auto px-6 py-20 text-center"
                            >
                                <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-indigo-500/20">
                                    <Zap className="text-white w-12 h-12" fill="white" />
                                </div>
                                <h1 className="text-5xl font-black mb-6">Gemini 2.0 Flash Core</h1>
                                <p className="text-gray-400 text-lg mb-12 max-w-2xl mx-auto">
                                    Echelon is powered by Google's latest frontier model, enabling real-time agentic reasoning and high-fidelity market simulations.
                                </p>
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="text-indigo-400 font-bold mb-1">Latency</div>
                                        <div className="text-2xl font-black">~1.2s</div>
                                    </div>
                                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="text-emerald-400 font-bold mb-1">Context</div>
                                        <div className="text-2xl font-black">1M+</div>
                                    </div>
                                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="text-amber-400 font-bold mb-1">Reasoning</div>
                                        <div className="text-2xl font-black">Agenticv2</div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {view === 'account' && (
                            <motion.div
                                key="account"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="max-w-3xl mx-auto px-6 py-20"
                            >
                                <h1 className="text-4xl font-black mb-2">Researcher Analytics</h1>
                                <p className="text-gray-400 mb-12">Manage your researcher identity and compliance settings.</p>

                                <div className="space-y-4">
                                    <div className="p-6 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-emerald-500 flex items-center justify-center font-bold">
                                                E
                                            </div>
                                            <div>
                                                <div className="font-bold">Explorer</div>
                                                <div className="text-xs text-gray-500">guest@echelon.ai</div>
                                            </div>
                                        </div>
                                        <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                                            HACKATHON ACCESS
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-6 bg-white/5 border border-white/5 rounded-2xl">
                                            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Simulations Run</div>
                                            <div className="text-3xl font-black">{history.length}</div>
                                        </div>
                                        <div className="p-6 bg-white/5 border border-white/5 rounded-2xl">
                                            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Market Coverage</div>
                                            <div className="text-3xl font-black">{Array.from(new Set(history.map(h => h.region))).length}</div>
                                        </div>
                                    </div>

                                    <div className="p-8 border border-white/5 bg-white/5 rounded-3xl">
                                        <h3 className="font-bold mb-6 flex items-center gap-2">
                                            <Users className="w-4 h-4 text-indigo-400" />
                                            Project Architects
                                        </h3>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                                                <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Lead Architect</div>
                                                <div className="font-bold text-sm">Nithesh Kolluri</div>
                                            </div>
                                            <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                                                <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Core Developer</div>
                                                <div className="font-bold text-sm">Tanvir Rahman Taiyeb</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 border border-white/5 bg-white/5 rounded-3xl">
                                        <h3 className="font-bold mb-4 flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-indigo-400" />
                                            Data Privacy & Hackathon Compliance
                                        </h3>
                                        <div className="space-y-4 text-xs text-gray-400 leading-relaxed">
                                            <p>
                                                By using Echelon, you agree to the Google Gemini 3 Hackathon official rules. Your simulation data is stored locally in your browser cache to ensure privacy.
                                            </p>
                                            <ul className="space-y-2">
                                                <li className="flex gap-2">
                                                    <div className="w-1 h-1 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                                                    Personal data is not transmitted to third-party advertisers.
                                                </li>
                                                <li className="flex gap-2">
                                                    <div className="w-1 h-1 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                                                    Simulation logs are cleared upon session termination (Guest Mode).
                                                </li>
                                                <li className="flex gap-2">
                                                    <div className="w-1 h-1 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                                                    AI outputs are governed by the Google Generative AI Prohibited Use Policy.
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {errorToast && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="bg-red-500 text-white px-6 py-3 rounded-full shadow-2xl font-bold flex items-center gap-3"
                    >
                        <Info className="w-5 h-5" />
                        {errorToast}
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default App;
