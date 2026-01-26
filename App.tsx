
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, RotateCcw, TrendingUp, Users, DollarSign, Activity, 
  BrainCircuit, Info, Zap, LayoutDashboard, Database, ArrowRight,
  ShieldCheck, Globe, Terminal, Cpu, Layers, BarChart3, ChevronRight,
  Settings, HelpCircle, MessageSquare, Sliders, Gem, Target, TrendingDown,
  Building2, LineChart as LucideLineChart, MapPin, ScatterChart as LucideScatterChart,
  CheckCircle2, AlertCircle, Sparkles, ClipboardList, Trophy, ArrowUpRight, Scale
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend, BarChart, Bar,
  ScatterChart, Scatter, ZAxis, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

import { Agent, MarketState, AgentArchetype } from './types';
import { analyzeIdeaAndCreateMarket, getStrategicIntervention, generateFinalAnalysis, FinalReportData } from './services/geminiService';
import { runSimulationTick, applyGeminiUpdates } from './services/simulationEngine';

const COLORS = ['#0f172a', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

const ArchetypeIcon = ({ archetype }: { archetype: AgentArchetype }) => {
  switch (archetype) {
    case 'Budget Provider': return <Target size={16} className="text-slate-500" />;
    case 'Premium Leader': return <ShieldCheck size={16} className="text-blue-600" />;
    case 'Value Specialist': return <Zap size={16} className="text-emerald-600" />;
    case 'High-End Boutique': return <Gem size={16} className="text-purple-600" />;
    case 'Rapid Expansionist': return <TrendingUp size={16} className="text-amber-500" />;
    default: return <Building2 size={16} className="text-slate-500" />;
  }
};

const Sidebar: React.FC<{ activeView: string; onViewChange: (v: any) => void }> = ({ activeView, onViewChange }) => {
  const items = [
    { id: 'landing', icon: Globe, label: 'Overview' },
    { id: 'setup', icon: Settings, label: 'Market Design' },
    { id: 'simulation', icon: LucideLineChart, label: 'Live Simulation' },
    { id: 'analysis', icon: BarChart3, label: 'Final Report' },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 flex flex-col bg-white z-30 shadow-sm">
      <div className="p-8 flex items-center gap-3">
        <div className="p-2 bg-slate-900 rounded-lg">
          <BrainCircuit size={20} className="text-white" />
        </div>
        <h1 className="font-heading font-bold text-xl tracking-tight text-slate-900">ECHELON</h1>
      </div>
      
      <nav className="flex-grow py-8 flex flex-col gap-1 px-4">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeView === item.id 
                ? 'bg-slate-100 text-slate-900 font-semibold' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <item.icon size={18} strokeWidth={activeView === item.id ? 2.5 : 2} />
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 mt-auto border-t border-slate-100 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <Activity size={12} className="text-emerald-500" /> System Active
        </div>
        <div className="text-[10px] text-slate-400 font-medium">Model v4.2.1-Elite</div>
      </div>
    </aside>
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'setup' | 'simulation' | 'analysis'>('landing');
  const [idea, setIdea] = useState('');
  const [region, setRegion] = useState('');
  const [population, setPopulation] = useState(20000); 
  const [sentiment, setSentiment] = useState(0.65);

  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [marketState, setMarketState] = useState<MarketState | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [finalAnalysis, setFinalAnalysis] = useState<FinalReportData | null>(null);
  
  const simIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const analysisSteps = [
    "Gathering regional market data...",
    "Benchmarking competitor performance...",
    "Analyzing consumer loyalty shifts...",
    "Simulating future scalability...",
    "Synthesizing strategic recommendations..."
  ];

  const handleLaunchModel = async () => {
    if (!idea.trim() || !region.trim()) return;
    setIsLoading(true);
    setLogs([`Analyzing ${region} market...`, `Identifying key local competitors...`]);
    try {
      const { agents, marketContext } = await analyzeIdeaAndCreateMarket(idea, region);
      const initializedAgents: Agent[] = (agents || []).map((a, i) => ({
        ...a,
        id: a.role === 'startup' ? 'USER_ID' : `COMP-${i+1}`,
        currentPricing: a.basePricing || 10,
        marketShare: 1 / (agents?.length || 1),
        revenue: 0,
        profit: 0,
        growthRate: 0,
        reasoning: 'Starting baseline behavior.',
        history: []
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
    } catch (e) {
      setLogs(prev => [...prev, 'Error: Could not retrieve market data.']);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimTick = useCallback(() => {
    setMarketState(prev => {
      if (!prev || prev.tick >= prev.maxTicks) {
        setIsSimulating(false);
        return prev;
      }
      if (prev.tick > 0 && prev.tick % 6 === 0) triggerExpertInput(prev);
      return runSimulationTick(prev);
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
          setLogs(l => [...l, `Event: ${response.marketEvent!.title}`]);
        }
        return newState;
      });
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (isSimulating) {
      simIntervalRef.current = setInterval(handleSimTick, 150);
    } else {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    }
    return () => { if (simIntervalRef.current) clearInterval(simIntervalRef.current); };
  }, [isSimulating, handleSimTick]);

  const handleReportGeneration = async () => {
    if (!marketState) return;
    setIsAnalyzing(true);
    setAnalysisStep(0);
    
    // Animate loading steps to fix perceived latency
    const stepInterval = setInterval(() => {
      setAnalysisStep(prev => (prev < analysisSteps.length - 1 ? prev + 1 : prev));
    }, 1500);

    try {
      const analysis = await generateFinalAnalysis(marketState);
      setFinalAnalysis(analysis);
      setView('analysis');
    } catch (e) { 
      console.error(e); 
    } finally { 
      clearInterval(stepInterval);
      setIsAnalyzing(false); 
    }
  };

  const reset = () => {
    setView('landing');
    setMarketState(null);
    setIdea('');
    setRegion('');
    setLogs([]);
    setFinalAnalysis(null);
  };

  const getWinner = () => marketState ? [...marketState.agents].sort((a,b)=>b.marketShare-a.marketShare)[0] : null;
  const getUserAgent = () => marketState?.agents.find(a => a.role === 'startup');

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 overflow-hidden font-sans">
      <Sidebar activeView={view} onViewChange={setView} />

      <main className="flex-grow flex flex-col relative overflow-hidden">
        {/* ENHANCED Loading Overlay */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/90 backdrop-blur-xl z-[100] flex flex-col items-center justify-center text-center p-12"
            >
              <motion.div 
                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="relative mb-12"
              >
                <div className="w-32 h-32 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
                <div className="absolute inset-0 m-auto w-16 h-16 bg-slate-900 rounded-2xl shadow-xl flex items-center justify-center">
                  <ClipboardList className="text-white" size={32} />
                </div>
              </motion.div>
              
              <div className="space-y-4 max-w-sm">
                <h3 className="text-3xl font-heading font-bold text-slate-900">Synthesizing Audit</h3>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(analysisStep + 1) / analysisSteps.length * 100}%` }}
                    className="h-full bg-emerald-500"
                  />
                </div>
                <AnimatePresence mode="wait">
                  <motion.p 
                    key={analysisStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-slate-500 font-medium"
                  >
                    {analysisSteps[analysisStep]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {view === 'landing' && (
            <motion.div 
              key="landing"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-grow flex flex-col items-center justify-center p-12 text-center"
            >
              <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center mb-10 shadow-2xl">
                <Building2 size={48} className="text-white" />
              </div>
              <h1 className="text-6xl font-heading font-bold tracking-tight text-slate-900 mb-6">Business Feasibility Tool</h1>
              <p className="text-slate-500 max-w-2xl text-xl leading-relaxed mb-12">
                Simulate how your business would perform in your neighborhood against real local competitors. 
                Data-driven logic for precise regional projections.
              </p>
              <button 
                onClick={() => setView('setup')}
                className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center gap-3 shadow-xl"
              >
                Initialize Strategy <ArrowRight size={24} />
              </button>
            </motion.div>
          )}

          {view === 'setup' && (
            <motion.div 
              key="setup"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex-grow flex items-center justify-center p-12 overflow-y-auto"
            >
              <div className="max-w-6xl w-full bg-white p-12 rounded-[2.5rem] shadow-sm border border-slate-200 grid grid-cols-1 lg:grid-cols-2 gap-20">
                <div className="space-y-10">
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-[0.2em]">Parameter Entry</span>
                    <h2 className="text-4xl font-heading font-bold text-slate-900">Market Profile</h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><MapPin size={16} /> Regional Focus</label>
                      <input 
                        type="text" 
                        value={region} 
                        onChange={(e)=>setRegion(e.target.value)}
                        placeholder="e.g. Shoreditch, London or SOMA, San Francisco..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-6 py-4 text-slate-900 text-lg focus:ring-2 focus:ring-slate-900 outline-none"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-700">Service/Product Definition</label>
                      <textarea
                        value={idea}
                        onChange={(e) => setIdea(e.target.value)}
                        placeholder="e.g. A boutique fitness studio specializing in low-impact HIIT for the tech sector..."
                        className="w-full h-48 bg-slate-50 border border-slate-200 rounded-xl p-6 text-slate-900 text-lg focus:ring-2 focus:ring-slate-900 outline-none transition-all resize-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleLaunchModel}
                    disabled={isLoading || !idea.trim() || !region.trim()}
                    className="w-full bg-slate-900 py-6 rounded-2xl text-white font-bold text-2xl hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-4 shadow-xl shadow-slate-200"
                  >
                    {isLoading ? <Activity className="animate-spin" /> : <><Globe size={28} /> Deploy Intelligence</>}
                  </button>
                </div>

                <div className="space-y-12 bg-slate-50/50 p-10 rounded-[2rem] border border-slate-100">
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Global Variables</span>
                    <h3 className="text-xl font-bold text-slate-900">Environment Scalars</h3>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-sm">
                        <label className="font-bold text-slate-700">Local Addressable Population</label>
                        <span className="font-mono font-bold text-slate-900">{(population / 1000).toFixed(0)}k Residents</span>
                      </div>
                      <input type="range" min="1000" max="500000" step="1000" value={population} onChange={(e)=>setPopulation(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg accent-slate-900 cursor-pointer" />
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-sm">
                        <label className="font-bold text-slate-700">Market Sentiment Index</label>
                        <span className="font-mono font-bold text-slate-900">{(sentiment * 100).toFixed(0)}%</span>
                      </div>
                      <input type="range" min="0" max="1" step="0.05" value={sentiment} onChange={(e)=>setSentiment(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg accent-slate-900 cursor-pointer" />
                    </div>
                  </div>
                  
                  <div className="p-8 bg-white rounded-2xl border border-slate-200 flex items-start gap-4 shadow-sm">
                    <Info size={24} className="text-slate-400 flex-shrink-0" />
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                      Echelon uses regional population density to normalize revenue potential. High density areas increase transaction frequency but typically harbor more aggressive incumbents.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'simulation' && marketState && (
            <motion.div 
              key="simulation"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex-grow flex flex-col p-10 overflow-y-auto"
            >
              <header className="flex justify-between items-center mb-10 pb-8 border-b border-slate-200">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-600 uppercase tracking-widest">
                    <MapPin size={14} /> Active Region: {marketState.region}
                  </div>
                  <h2 className="text-4xl font-heading font-bold text-slate-900">Live Strategic Simulation</h2>
                  <p className="text-slate-500 font-bold">Month {marketState.tick} of {marketState.maxTicks}</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
                    <button 
                      onClick={() => setIsSimulating(!isSimulating)}
                      disabled={marketState.tick >= marketState.maxTicks}
                      className={`px-6 py-3 rounded-xl transition-all font-bold flex items-center gap-2 ${isSimulating ? 'bg-slate-100 text-slate-900' : 'bg-slate-900 text-white shadow-lg'}`}
                    >
                      {isSimulating ? <><Pause size={20} fill="currentColor" /> Pause Model</> : <><Play size={20} fill="currentColor" /> Resume Logic</>}
                    </button>
                    <button onClick={reset} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"><RotateCcw size={20} /></button>
                  </div>
                  {marketState.tick >= marketState.maxTicks && (
                    <button onClick={handleReportGeneration} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-xl transition-all animate-bounce">
                      <BarChart3 size={20} /> Generate Feasibility Audit
                    </button>
                  )}
                </div>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-10">
                {[
                  { label: 'Current Leader', value: getWinner()?.name || '---', icon: Users, color: 'text-slate-900' },
                  { label: 'Cumulative Region Rev', value: `$${(marketState.agents.reduce((s,a)=>s+a.revenue,0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: DollarSign, color: 'text-emerald-600' },
                  { label: 'Consumer Index', value: `${(marketState.marketSentiment*100).toFixed(0)}%`, icon: TrendingUp, color: 'text-blue-600' },
                  { label: 'Market Velocity', value: marketState.tick < 12 ? 'Scaling Phase' : 'Established', icon: Activity, color: 'text-slate-600' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm transition-transform hover:scale-[1.02]">
                    <div className="flex items-center gap-2 text-slate-400 mb-2 text-[10px] font-bold uppercase tracking-widest">
                      <stat.icon size={12} /> {stat.label}
                    </div>
                    <div className={`text-3xl font-bold ${stat.color} truncate`}>{stat.value}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[450px] mb-12">
                <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2"><LucideLineChart size={14} /> Percentage Market Share Projection</h3>
                  <div className="flex-grow">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={Array.from({ length: marketState.tick }, (_, t) => {
                        const d: any = { tick: t };
                        marketState.agents.forEach(a => { d[a.name] = (a.history.find(h => h.tick === t)?.share || 0) * 100; });
                        return d;
                      })}>
                        <defs>
                          {COLORS.map((color, i) => (
                            <linearGradient key={i} id={`grad${i}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={color} stopOpacity={0.15}/>
                              <stop offset="95%" stopColor={color} stopOpacity={0}/>
                            </linearGradient>
                          ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="tick" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} label={{ value: 'Month Index', position: 'bottom', offset: 0, fontSize: 10 }} />
                        <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                        <Tooltip 
                          contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
                          formatter={(value: any) => [`${value.toFixed(1)}%`, 'Share']}
                        />
                        {marketState.agents.map((agent, i) => (
                          <Area key={agent.id} type="monotone" dataKey={agent.name} stackId="1" stroke={COLORS[i % COLORS.length]} fill={`url(#grad${i})`} strokeWidth={2.5} />
                        ))}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl flex flex-col text-white">
                  <div className="p-8 border-b border-slate-800">
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Activity size={14} /> Logic Flow</h3>
                  </div>
                  <div className="flex-grow overflow-y-auto p-6 space-y-4 font-mono text-[11px]">
                    {logs.slice(-15).reverse().map((log, i) => (
                      <div key={i} className={`p-4 rounded-2xl ${i === 0 ? 'bg-white/10 text-white border border-white/5 shadow-inner' : 'text-slate-400'}`}>
                        <span className="text-emerald-400 mr-2">>>></span> {log}
                      </div>
                    ))}
                    {logs.length === 0 && <div className="p-10 text-center text-slate-500 italic">Standby for data link...</div>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-20">
                {marketState.agents.map((agent, i) => (
                  <div key={agent.id} className={`executive-card p-8 flex flex-col gap-6 bg-white border ${agent.role === 'startup' ? 'ring-2 ring-emerald-500/50 scale-105 shadow-2xl' : 'border-slate-100'}`}>
                    <div className="flex justify-between items-start">
                      <div className={`p-3 rounded-2xl ${agent.role === 'startup' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-600'}`}>
                        {agent.role === 'startup' ? <Sparkles size={16} /> : <ArchetypeIcon archetype={agent.archetype} />}
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-slate-900">{(agent.marketShare * 100).toFixed(1)}%</div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">MKT Share</div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-base text-slate-900 truncate flex items-center gap-1.5">
                        {agent.name} {agent.role === 'startup' && <CheckCircle2 size={12} className="text-emerald-500" />}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tighter">{agent.archetype}</p>
                    </div>
                    <div className="space-y-4 pt-4 border-t border-slate-50">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-slate-400 uppercase">Avg Yield/Visit</span>
                        <span className="text-slate-900 font-mono">${agent.currentPricing.toFixed(2)}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-slate-400 uppercase">Quality Vector</span>
                          <span className="text-slate-900 font-mono">{(agent.quality * 10).toFixed(1)}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${agent.quality * 100}%` }} className={`h-full ${agent.role === 'startup' ? 'bg-emerald-500' : 'bg-slate-900'}`} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'analysis' && finalAnalysis && (
            <motion.div 
              key="analysis"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              className="flex-grow flex flex-col p-12 overflow-y-auto"
            >
              <div className="max-w-6xl mx-auto w-full space-y-12 pb-24">
                <header className="text-center space-y-4">
                  <div className="status-pill bg-slate-900 text-white inline-block font-bold">Confidential Business Audit</div>
                  <h2 className="text-6xl font-heading font-bold text-slate-900 leading-tight">Board-Ready Strategic Feasibility Report</h2>
                  <p className="text-slate-500 text-xl max-w-2xl mx-auto">Regional performance summary for {marketState?.region}.</p>
                </header>

                {/* Performance Gauge & Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Success Probability</div>
                      <div className={`text-7xl font-bold mb-4 tracking-tighter ${finalAnalysis.feasibilityScore > 70 ? 'text-emerald-500' : finalAnalysis.feasibilityScore > 40 ? 'text-amber-500' : 'text-rose-500'}`}>
                        {finalAnalysis.feasibilityScore}%
                      </div>
                      <div className="status-pill bg-slate-100 text-slate-900 font-bold px-6">{finalAnalysis.verdict}</div>
                    </div>
                  </div>

                  <div className="md:col-span-2 bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col justify-center">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2 font-heading"><ClipboardList size={14} className="text-slate-900" /> Executive Context</h4>
                    <p className="text-slate-700 leading-relaxed font-medium text-lg">
                      {finalAnalysis.summary}
                    </p>
                  </div>
                </div>

                {/* Head-to-Head Visuals */}
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-12">
                   <div className="bg-slate-900 text-white rounded-[3rem] p-12 shadow-2xl border border-slate-800">
                      <div className="flex items-center justify-between mb-12">
                        <div className="space-y-1">
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Head-to-Head Profile</h4>
                          <h3 className="text-3xl font-heading font-bold">You vs. Market Leader</h3>
                        </div>
                        <Scale className="text-emerald-400" size={32} />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
                         {/* User Stats */}
                         <div className="space-y-6">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center font-bold text-white shadow-lg">U</div>
                               <div>
                                  <div className="text-xs font-bold text-slate-500 uppercase">Your Business</div>
                                  <div className="text-sm font-bold">{getUserAgent()?.name}</div>
                               </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                               <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                  <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Total Revenue</div>
                                  <div className="text-lg font-bold text-emerald-400">${finalAnalysis.headToHead.userRevenue}</div>
                               </div>
                               <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                  <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Mkt Share</div>
                                  <div className="text-lg font-bold">{finalAnalysis.headToHead.userMarketShare}</div>
                               </div>
                            </div>
                         </div>

                         {/* VS Indicator */}
                         <div className="flex flex-col items-center justify-center">
                            <div className="text-xs font-bold text-slate-600 uppercase mb-4 tracking-[0.3em]">Competitiveness</div>
                            <div className="w-full space-y-4">
                               <div className="flex justify-between items-center text-[10px] font-bold">
                                  <span className="text-slate-500">PRICING</span>
                                  <span className="text-emerald-400">{finalAnalysis.headToHead.priceCompetitive} Match</span>
                               </div>
                               <div className="h-1 w-full bg-white/10 rounded-full"><div className="h-full bg-emerald-500 w-[70%]" /></div>
                               <div className="flex justify-between items-center text-[10px] font-bold pt-2">
                                  <span className="text-slate-500">QUALITY</span>
                                  <span className="text-blue-400">{finalAnalysis.headToHead.qualityCompetitive} Status</span>
                               </div>
                               <div className="h-1 w-full bg-white/10 rounded-full"><div className="h-full bg-blue-500 w-[85%]" /></div>
                            </div>
                         </div>

                         {/* Leader Stats */}
                         <div className="space-y-6 text-right md:text-left">
                            <div className="flex items-center gap-3 md:flex-row-reverse">
                               <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-900 shadow-lg"><Trophy size={18} /></div>
                               <div className="md:text-right">
                                  <div className="text-xs font-bold text-slate-500 uppercase">Current Leader</div>
                                  <div className="text-sm font-bold">{getWinner()?.name}</div>
                               </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                               <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                  <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Total Revenue</div>
                                  <div className="text-lg font-bold text-slate-200">${finalAnalysis.headToHead.leaderRevenue}</div>
                               </div>
                               <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                  <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Mkt Share</div>
                                  <div className="text-lg font-bold text-slate-200">{finalAnalysis.headToHead.leaderMarketShare}</div>
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Radar Comparison & SWOT */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col items-center">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-10 text-center font-heading">Strategic Vector Radar</h4>
                    <div className="h-96 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={finalAnalysis.comparison}>
                          <PolarGrid stroke="#f1f5f9" />
                          <PolarAngleAxis dataKey="attribute" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                          <PolarRadiusAxis angle={30} domain={[0, 10]} axisLine={false} tick={false} />
                          <Radar name="You" dataKey="user" stroke="#10b981" strokeWidth={3} fill="#10b981" fillOpacity={0.5} />
                          <Radar name="Market Leader" dataKey="leader" stroke="#0f172a" strokeWidth={3} fill="#0f172a" fillOpacity={0.2} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} 
                            itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                          />
                          <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: '30px' }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-emerald-50 border border-emerald-100 p-10 rounded-[2.5rem] shadow-sm">
                        <h5 className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-6 flex items-center gap-2"><CheckCircle2 size={14} /> Critical Strengths</h5>
                        <ul className="space-y-3">
                          {finalAnalysis.swot.strengths.slice(0, 3).map((s, i) => (
                            <li key={i} className="text-sm font-bold text-emerald-900 flex items-start gap-3">
                               <ArrowUpRight size={14} className="mt-0.5 text-emerald-400" /> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-rose-50 border border-rose-100 p-10 rounded-[2.5rem] shadow-sm">
                        <h5 className="text-[10px] font-bold text-rose-700 uppercase tracking-widest mb-6 flex items-center gap-2"><AlertCircle size={14} /> Risks & Gaps</h5>
                        <ul className="space-y-3">
                          {finalAnalysis.swot.weaknesses.slice(0, 3).map((s, i) => (
                            <li key={i} className="text-sm font-bold text-rose-900 flex items-start gap-3">
                               <TrendingDown size={14} className="mt-0.5 text-rose-400" /> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="bg-slate-900 text-white p-12 rounded-[3rem] shadow-2xl space-y-8 border border-slate-800 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                         <BrainCircuit size={120} />
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                        <Activity size={14} /> Final Strategic Recommendation
                      </div>
                      <p className="text-2xl font-heading font-bold leading-tight relative z-10">
                        {finalAnalysis.recommendation}
                      </p>
                      <div className="pt-4 flex gap-4 relative z-10">
                        <button onClick={reset} className="flex-grow bg-white text-slate-900 py-5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-all shadow-xl">
                          <RotateCcw size={18} /> New Business Case
                        </button>
                        <button className="px-6 py-5 bg-white/10 rounded-2xl text-white hover:bg-white/20 transition-all">
                           <Database size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Equilibrium Share Bar */}
                <div className="bg-white p-16 rounded-[3rem] border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-end mb-12">
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Neighborhood Saturation Analysis</h4>
                      <h3 className="text-2xl font-heading font-bold">Consolidated Market Share</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400 font-bold uppercase mb-1">Year 3 Aggregate Value</div>
                      <div className="text-4xl font-bold text-slate-900 tracking-tighter">${(marketState?.agents.reduce((s,a)=>s+a.revenue,0) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    </div>
                  </div>
                  <div className="h-40 w-full flex rounded-3xl overflow-hidden shadow-inner bg-slate-50 border border-slate-100 p-2">
                    {marketState?.agents.map((agent, i) => (
                      <div 
                        key={agent.id} 
                        style={{ width: `${agent.marketShare * 100}%` }}
                        className="h-full relative group transition-all"
                      >
                        <div className="w-full h-full p-1">
                          <motion.div 
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            className="w-full h-full rounded-2xl shadow-sm" 
                            style={{ backgroundColor: COLORS[i % COLORS.length] }} 
                          />
                        </div>
                        <div className="absolute top-full left-0 mt-6 opacity-0 group-hover:opacity-100 transition-all bg-slate-900 text-white p-6 rounded-2xl shadow-2xl z-50 w-64 translate-y-2 group-hover:translate-y-0">
                          <div className="text-sm font-bold border-b border-white/10 pb-2 mb-3 flex items-center justify-between">
                             {agent.name} {agent.role === 'startup' && "(You)"}
                             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          </div>
                          <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-400">
                             <span>Mkt Share</span>
                             <span className="text-white">{(agent.marketShare * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-400 mt-2">
                             <span>Rev Yield</span>
                             <span className="text-emerald-400">${agent.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest px-4">
                    <span>Low Penetration Index</span>
                    <div className="flex gap-4">
                       <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> You</span>
                       <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-900" /> Competitors</span>
                    </div>
                    <span>100% Saturation</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="h-12 border-t border-slate-200 bg-white px-8 flex items-center justify-between text-[11px] font-bold text-slate-400 z-40">
          <div className="flex items-center gap-8 uppercase tracking-widest">
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" /> Feasibility Engine: {marketState ? 'COMPUTING' : 'IDLE'}</div>
            <div className="text-slate-300">Region: {marketState?.region || 'GLOBAL_CORE'}</div>
            <div>Auth: 421-E-PRO</div>
          </div>
          <div className="flex items-center gap-8">
            <HelpCircle size={16} className="cursor-pointer hover:text-slate-900 transition-colors" />
            <MessageSquare size={16} className="cursor-pointer hover:text-slate-900 transition-colors" />
            <span className="bg-slate-100 px-4 py-1 rounded-full border border-slate-200 text-slate-500">v4.2.1 PLATINUM</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;
