"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play, Pause, RotateCcw, TrendingUp, DollarSign, Activity,
    BrainCircuit, Info, Globe, ArrowRight,
    Menu, RefreshCcw, BarChart3, HelpCircle, MessageSquare, Database,
    Trophy, MapPin, Building2, Terminal, User as UserIcon, LogOut, Zap, Shield
} from 'lucide-react';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';

import type { Agent, MarketState } from '@/lib/types';
import { authApi, simulationApi, reportApi } from '@/lib/api';
import type { FinalReportData } from '@/lib/gemini';
import { Sidebar } from '@/components/Sidebar';
import { AnalysisReport } from '@/components/AnalysisReport';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'];

const App: React.FC = () => {
    // Guest User State (Auth removed per requirements)
    const [user, setUser] = useState<any>({
        name: 'Explorer',
        tier: 'PRO',
        email: 'guest@echelon.ai'
    });
    const [token, setToken] = useState<string | null>("guest-token");
    const [isCheckingAuth, setIsCheckingAuth] = useState(false);

    // Navigation/View State
    const [view, setView] = useState<'landing' | 'setup' | 'simulation' | 'analysis'>('landing');
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

    const [mounted, setMounted] = useState(false);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

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
                        <div>
                            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                                Mission Control
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                            <Zap className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-tighter">
                                {user.tier} TIER
                            </span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-emerald-500 flex items-center justify-center font-bold text-xs ring-2 ring-white/10 ring-offset-2 ring-offset-black">
                            {user.name[0]}
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
