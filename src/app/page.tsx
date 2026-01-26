
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play, Pause, RotateCcw, TrendingUp, DollarSign, Activity,
    BrainCircuit, Info, Globe, ArrowRight,
    Menu, RefreshCcw, BarChart3, HelpCircle, MessageSquare, Database,
    Trophy, MapPin, Building2, Terminal
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

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'];

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
    const [logs, setLogs] = useState<string[]>([]);
    const [finalAnalysis, setFinalAnalysis] = useState<FinalReportData | null>(null);
    const [errorToast, setErrorToast] = useState<string | null>(null);
    const simIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const logWithTimestamp = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString().split(' ')[0]}] ${msg}`, ...prev].slice(0, 50));
    };

    const handleLaunchModel = async () => {
        if (!idea.trim() || !region.trim()) return;
        setIsLoading(true); setErrorToast(null);
        try {
            const { agents, marketContext } = await analyzeIdeaAndCreateMarket(idea, region);
            logWithTimestamp("Gemini AI: Initializing market agents...");

            const initializedAgents: Agent[] = (agents || []).map((a, i) => ({
                ...a,
                id: a.role === 'startup' ? 'USER_ID' : `COMP-${i + 1}`,
                currentPricing: a.basePricing || 10,
                marketShare: 1 / (agents?.length || 1),
                revenue: 0, profit: 0, growthRate: 0, history: [], reasoning: 'Analyzing market entry...'
            } as Agent));

            setMarketState({
                region,
                populationScale: population,
                visitsPerMonth: marketContext.visitsPerMonth || 4,
                marketSentiment: sentiment,
                volatility: 0.05,
                tick: 0,
                maxTicks: 36,
                agents: initializedAgents,
                events: []
            });
            setView('simulation');
            logWithTimestamp(`Simulation ready. ${initializedAgents.length} agents detected.`);
        } catch (e: any) {
            setErrorToast(e?.message?.includes('429') ? "Throttled. Retrying..." : "Init Error. Checking connectivity.");
            console.error(e);
        } finally { setIsLoading(false); }
    };

    const handleSimTick = useCallback(() => {
        setMarketState((prev: MarketState | null) => {
            if (!prev) return null;
            if (prev.tick >= prev.maxTicks) {
                setIsSimulating(false);
                return prev;
            }

            // Perform physics update
            const nextState = runSimulationTick(prev);

            // Logging major shifts
            nextState.agents.forEach(a => {
                const prevAgent = prev.agents.find(p => p.id === a.id);
                if (prevAgent && Math.abs(a.marketShare - prevAgent.marketShare) > 0.05) {
                    logWithTimestamp(`${a.name} seeing major volatility.`);
                }
            });

            return nextState;
        });
    }, []);

    // Trigger expert input based on tick changes
    useEffect(() => {
        if (!marketState || !isSimulating) return;
        if (marketState.tick > 0 && marketState.tick % 6 === 0) {
            triggerExpertInput(marketState);
        }
    }, [marketState?.tick, isSimulating]);

    const triggerExpertInput = async (currentState: MarketState) => {
        try {
            logWithTimestamp("Gemini AI: Analyzing market strategy checkpoint...");
            const response = await getStrategicIntervention(currentState);
            setMarketState(prev => {
                if (!prev) return null;
                let newState = applyGeminiUpdates(prev, response.updates);
                if (response.marketEvent) {
                    newState.events.push({ tick: prev.tick, ...response.marketEvent });
                    logWithTimestamp(`EVENT: ${response.marketEvent.title}`);
                }

                response.updates.forEach(u => {
                    const agent = newState.agents.find(a => a.id === u.agentId);
                    if (agent) logWithTimestamp(`STRATEGY [${agent.name}]: ${u.reasoning.substring(0, 50)}...`);
                });

                return newState;
            });
        } catch (e) { console.error(e) }
    };

    useEffect(() => {
        if (isSimulating) simIntervalRef.current = setInterval(handleSimTick, 200); // Slower tick for visual clarity
        else if (simIntervalRef.current) clearInterval(simIntervalRef.current);
        return () => { if (simIntervalRef.current) clearInterval(simIntervalRef.current); };
    }, [isSimulating, handleSimTick]);

    const handleReportGeneration = async () => {
        if (!marketState) return;
        setIsAnalyzing(true); setAnalysisStep(0);
        const steps = ["Computing final revenue models...", "Analyzing competitive moats...", "Synthesizing strategic recommendations...", "Generating executive summary..."];

        const stepInterval = setInterval(() => {
            setAnalysisStep(p => (p < steps.length - 1 ? p + 1 : p));
        }, 1200);

        try {
            const analysis = await generateFinalAnalysis(marketState);
            setFinalAnalysis(analysis); setView('analysis');
        } catch (e: any) {
            console.error(e);
            if (e?.message?.includes('429')) setIsRetrying(true);
        } finally { clearInterval(stepInterval); setIsAnalyzing(false); setIsRetrying(false); }
    };

    const reset = () => { setView('landing'); setMarketState(null); setIdea(''); setRegion(''); setLogs([]); setFinalAnalysis(null); setErrorToast(null); };

    const getWinner = () => marketState ? [...marketState.agents].sort((a, b) => b.marketShare - a.marketShare)[0] : null;

    // Formatting helpers
    const formatMoney = (n: number) => `$${(n / 1000).toFixed(1)}k`;

    return (
        <div className="flex h-screen w-full bg-[#0B0F19] text-slate-100 overflow-hidden font-sans">
            {/* Sidebar (Only shown after landing) */}
            {view !== 'landing' && (
                <div className="hidden lg:block w-20 border-r border-slate-800 bg-[#0B0F19] flex flex-col items-center py-8 z-50">
                    <div className="bg-indigo-600 p-3 rounded-xl mb-8 shadow-lg shadow-indigo-500/20"><BrainCircuit size={24} className="text-white" /></div>
                    <nav className="flex flex-col gap-4 w-full px-2">
                        {['setup', 'simulation', 'analysis'].map(v => (
                            <button key={v} onClick={() => view !== 'landing' && setView(v as any)} disabled={v === 'analysis' && !finalAnalysis} className={`p-3 rounded-xl flex justify-center transition-all ${view === v ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                                {v === 'setup' && <Globe size={20} />}
                                {v === 'simulation' && <Activity size={20} />}
                                {v === 'analysis' && <BarChart3 size={20} />}
                            </button>
                        ))}
                    </nav>
                </div>
            )}

            <main className="flex-grow flex flex-col relative overflow-hidden bg-gradient-to-br from-[#0B0F19] to-[#111827]">

                {/* Loader Overlay */}
                <AnimatePresence>
                    {isAnalyzing && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-xl z-[100] flex flex-col items-center justify-center p-6 text-center">
                            <div className="w-24 h-24 relative">
                                <div className="absolute inset-0 rounded-full border-t-4 border-indigo-500 animate-spin"></div>
                                <div className="absolute inset-2 rounded-full border-b-4 border-emerald-500 animate-spin-reverse opacity-70"></div>
                            </div>
                            <div className="mt-8 space-y-2 max-w-sm w-full">
                                <h3 className="text-2xl font-bold tracking-tight">Gemini Reasoning</h3>
                                <p className="text-slate-400 text-sm font-mono animate-pulse">Running Simulation Analysis...</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    {/* Landing Page */}
                    {view === 'landing' && (
                        <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }} className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]">
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-transparent to-indigo-900/20 pointer-events-none" />
                            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-8">
                                Powered by Google Gemini 2.0
                            </motion.div>
                            <h1 className="text-6xl sm:text-8xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500">
                                ECHELON
                            </h1>
                            <p className="text-lg sm:text-xl text-slate-400 max-w-xl leading-relaxed mb-12">
                                Feasibility is no longer a guess. Simulate your startup idea against AI agents in a living, breathing market economy.
                            </p>
                            <button onClick={() => setView('setup')} className="group relative bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:px-10 transition-all flex items-center gap-3">
                                Initialize Simulation <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </motion.div>
                    )}

                    {/* Setup Page */}
                    {view === 'setup' && (
                        <motion.div key="setup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-grow flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
                            <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-12 items-center">
                                <div className="space-y-8">
                                    <div>
                                        <h2 className="text-4xl font-bold mb-2">Configure Market</h2>
                                        <p className="text-slate-400">Define the parameters for the simulation environment.</p>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Target Region</label>
                                            <input
                                                value={region} onChange={e => setRegion(e.target.value)}
                                                placeholder="e.g. Austin, Texas"
                                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-5 py-4 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-lg font-medium"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Business Concept</label>
                                            <textarea
                                                value={idea} onChange={e => setIdea(e.target.value)}
                                                placeholder="Describe your startup idea in detail..."
                                                className="w-full h-40 bg-slate-800/50 border border-slate-700 rounded-xl p-5 outline-none resize-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-lg leading-relaxed"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <button onClick={handleLaunchModel} disabled={isLoading || !idea || !region} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-2xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3">
                                            {isLoading ? <Activity className="animate-spin" /> : <><BrainCircuit size={20} /> Generate Agents & Start</>}
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2rem] space-y-8 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-20"><Globe size={120} /></div>
                                    <h3 className="text-lg font-bold text-white relative z-10">Simulation Scalars</h3>

                                    <div className="space-y-6 relative z-10">
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm font-bold text-slate-400"><span>Population</span><span>{(population / 1000).toFixed(0)}k</span></div>
                                            <input type="range" min="1000" max="500000" step="1000" value={population} onChange={e => setPopulation(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm font-bold text-slate-400"><span>Market Sentiment</span><span>{(sentiment * 100).toFixed(0)}%</span></div>
                                            <input type="range" min="0" max="1" step="0.05" value={sentiment} onChange={e => setSentiment(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                                        </div>
                                    </div>

                                    <div className="p-5 bg-slate-800/80 rounded-xl border border-slate-700 flex gap-4 items-start">
                                        <Info size={20} className="text-indigo-400 mt-1 flex-shrink-0" />
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            The simulation engine uses these scalars to determine total addressable market (TAM) and churn probability. Higher sentiment reduces Customer Acquisition Cost (CAC).
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Simulation Dashboard */}
                    {view === 'simulation' && marketState && (
                        <motion.div
                            key="simulation"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex-grow flex flex-col overflow-y-auto p-4 sm:p-6 gap-4 sm:gap-6"
                        >
                            {/* Top Bar */}
                            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900/50 p-4 sm:p-6 rounded-2xl border border-slate-800 gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl"><MapPin size={20} /></div>
                                    <div>
                                        <h2 className="font-bold text-lg sm:text-xl leading-none">{marketState.region}</h2>
                                        <div className="text-xs text-slate-500 font-mono mt-1">Month {marketState.tick} / {marketState.maxTicks}</div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                                    <button
                                        onClick={() => setIsSimulating(!isSimulating)}
                                        className={`flex-1 sm:flex-none px-6 sm:px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg text-sm sm:text-base ${isSimulating
                                                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                                : marketState.tick === 0
                                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse'
                                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                            }`}
                                    >
                                        {isSimulating ? <><Pause size={18} /> Pause</> : <><Play size={18} /> {marketState.tick === 0 ? 'Start' : 'Resume'}</>}
                                    </button>
                                    {marketState.tick >= marketState.maxTicks && (
                                        <button
                                            onClick={handleReportGeneration}
                                            className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-6 sm:px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg animate-pulse text-sm sm:text-base"
                                        >
                                            <BarChart3 size={18} /> View Report
                                        </button>
                                    )}
                                    <button
                                        onClick={reset}
                                        className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all"
                                        title="Reset Simulation"
                                    >
                                        <RotateCcw size={18} />
                                    </button>
                                </div>
                            </header>

                            {/* Main Content Grid - Responsive */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 flex-grow">

                                {/* Left Col: Stats & Leaderboard */}
                                <div className="lg:col-span-3 flex flex-col gap-4 sm:gap-6">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                                            <div className="text-xs text-slate-500 uppercase font-bold mb-1">Total Rev</div>
                                            <div className="text-lg sm:text-xl font-mono text-emerald-400">{formatMoney(marketState.agents.reduce((s, a) => s + a.revenue, 0))}</div>
                                        </div>
                                        <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                                            <div className="text-xs text-slate-500 uppercase font-bold mb-1">Leader</div>
                                            <div className="text-sm sm:text-md font-bold truncate">{getWinner()?.name || '-'}</div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 sm:p-5 flex-grow overflow-y-auto max-h-[400px] lg:max-h-none">
                                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2"><Trophy size={14} /> Live Rankings</h3>
                                        <div className="space-y-3">
                                            {[...marketState.agents].sort((a, b) => b.marketShare - a.marketShare).map((agent, i) => (
                                                <div key={agent.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <div className={`w-2 h-8 rounded-full flex-shrink-0 ${i === 0 ? 'bg-yellow-500' : agent.role === 'startup' ? 'bg-indigo-500' : 'bg-slate-600'}`} />
                                                        <div className="min-w-0 flex-1">
                                                            <div className="font-bold text-sm truncate">{agent.name}</div>
                                                            <div className="text-[10px] text-slate-400 truncate">{agent.archetype}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <div className="font-mono text-sm">{(agent.marketShare * 100).toFixed(1)}%</div>
                                                        <div className="text-[10px] text-emerald-500">{formatMoney(agent.revenue)}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Center Col: Main Chart */}
                                <div className="lg:col-span-6 bg-slate-900/50 border border-slate-800 rounded-3xl p-4 sm:p-6 flex flex-col min-h-[400px]">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2"><Activity size={16} /> Market Share Velocity</h3>
                                    <div className="flex-grow min-h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={Array.from({ length: (marketState?.tick || 0) + 1 }, (_, t) => {
                                                if (t === 0) return null;
                                                const d: any = { tick: t };
                                                marketState?.agents?.forEach(a => {
                                                    const hist = a.history.find(h => h.tick === t);
                                                    const val = (hist?.share ?? a.marketShare ?? 0) * 100;
                                                    d[a.name] = isNaN(val) ? 0 : val;
                                                });
                                                return d;
                                            }).filter(Boolean)}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                                <XAxis dataKey="tick" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                                                <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} tickFormatter={v => `${v.toFixed(0)}%`} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                                                    itemStyle={{ fontSize: '12px' }}
                                                />
                                                {marketState?.agents?.map((a, i) => (
                                                    <Area key={a.id} type="monotone" dataKey={a.name} stackId="1" stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.2} strokeWidth={2} />
                                                ))}
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Right Col: Logic Logs */}
                                <div className="lg:col-span-3 bg-black rounded-2xl border border-slate-800 p-4 flex flex-col font-mono text-xs min-h-[400px] max-h-[600px] lg:max-h-none">
                                    <div className="flex items-center gap-2 text-slate-500 mb-4 pb-2 border-b border-white/10">
                                        <Terminal size={14} /> <div>SYSTEM_LOGS</div>
                                    </div>
                                    <div className="flex-grow overflow-y-auto space-y-2 opacity-80">
                                        {logs.length === 0 ? (
                                            <div className="text-slate-600 text-center py-8">Awaiting simulation start...</div>
                                        ) : (
                                            logs.map((log, i) => (
                                                <div key={i} className="text-slate-300 break-words leading-relaxed">
                                                    <span className="text-slate-600 mr-2">{'>'}</span>{log}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Analysis Page */}
                    {view === 'analysis' && finalAnalysis && marketState && (
                        <motion.div key="analysis" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-grow flex flex-col p-6 sm:p-12 overflow-y-auto bg-[#0B0F19]">
                            <AnalysisReport finalAnalysis={finalAnalysis} marketState={marketState} onReset={reset} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default App;
