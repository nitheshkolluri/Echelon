"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Info } from "lucide-react";

import type { MarketState } from "@/lib/types";
import { simulationApi } from "@/lib/api";
import type { FinalReportData } from "@/lib/reportTypes";

import { Sidebar } from "@/components/Sidebar";
import { AnalysisReport } from "@/components/AnalysisReport";

// screens
import LandingScreen from "@/app/screens/LandingScreen";
import SimulationScreen from "@/app/screens/SimulationScreen";
import HistoryScreen from "@/app/screens/HistoryScreen";
import LabScreen from "@/app/screens/LabScreen";
import GeminiScreen from "@/app/screens/GeminiScreen";
import AccountScreen from "@/app/screens/AccountScreen";

const App: React.FC = () => {
    // Guest User State (Auth removed per requirements)
    const [user] = useState<any>({
        name: "Explorer",
        tier: "HACKATHON",
        email: "guest@echelon.ai",
    });

    // Navigation/View State
    const [view, setView] = useState<
        "landing" | "setup" | "simulation" | "analysis" | "history" | "lab" | "gemini" | "account"
    >("landing");

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Simulation Config
    const [idea, setIdea] = useState("");
    const [region, setRegion] = useState("");
    const [population] = useState(20000);
    const [sentiment] = useState(0.65);
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
        const savedHistory = localStorage.getItem("echelon_history");
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
            report,
        };
        const updatedHistory = [newEntry, ...history].slice(0, 10);
        setHistory(updatedHistory);
        localStorage.setItem("echelon_history", JSON.stringify(updatedHistory));
    };

    const logWithTimestamp = (msg: string) => {
        setLogs((prev) => [`[${new Date().toLocaleTimeString().split(" ")[0]}] ${msg}`, ...prev].slice(0, 50));
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
                duration,
            });

            const { simulationId: sid } = response.data;
            setSimulationId(sid);
            setView("simulation");

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

                if (sim.status === "RUNNING" || sim.status === "PENDING") {
                    logWithTimestamp(`Simulation progressing: ${sim.progress}%`);
                } else if (sim.status === "COMPLETED") {
                    clearInterval(pollingRef.current!);
                    setMarketState(sim.marketState);
                    setFinalAnalysis(sim.report);
                    saveToHistory(sim.marketState, sim.report);
                    logWithTimestamp("✅ Simulation completed successfully.");
                    setIsLoading(false);
                    setTimeout(() => setView("analysis"), 1500);
                } else if (sim.status === "FAILED") {
                    clearInterval(pollingRef.current!);
                    setErrorToast(sim.error || "Simulation engine encountered an error.");
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
                                {view === "landing" ? "Mission Control" : view.replace("-", " ")}
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
                                <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-tighter">
                                    Verified Researcher
                                </span>
                            </div>
                        </div>

                        <div
                            onClick={() => setView("account")}
                            className="w-10 h-10 rounded-xl bg-[#121212] flex items-center justify-center border border-white/10 hover:border-indigo-500/50 cursor-pointer transition-all active:scale-95 group"
                        >
                            <img
                                src="/logo.png"
                                alt="Profile"
                                className="w-6 h-6 object-contain grayscale group-hover:grayscale-0 transition-all"
                            />
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {view === "landing" && (
                            <LandingScreen
                                idea={idea}
                                setIdea={setIdea}
                                region={region}
                                setRegion={setRegion}
                                duration={duration}
                                setDuration={setDuration}
                                startSimulation={startSimulation}
                                isLoading={isLoading}
                            />
                        )}

                        {view === "simulation" && (
                            <SimulationScreen
                                progress={progress}
                                logs={logs}
                                marketState={marketState}
                                error={errorToast}
                                onReset={() => setView("landing")}
                            />
                        )}

                        {view === "analysis" && marketState && finalAnalysis && (
                            <motion.div
                                key="analysis"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-6 max-w-7xl mx-auto w-full"
                            >
                                <AnalysisReport
                                    finalAnalysis={finalAnalysis}
                                    marketState={marketState}
                                    onReset={() => setView("landing")}
                                />
                            </motion.div>
                        )}

                        {view === "history" && (
                            <HistoryScreen
                                history={history}
                                onClear={() => {
                                    setHistory([]);
                                    localStorage.removeItem("echelon_history");
                                }}
                                onOpenItem={(sim) => {
                                    setIdea(sim.idea);
                                    setRegion(sim.region);
                                    setMarketState(sim.marketState);
                                    setFinalAnalysis(sim.report);
                                    setView("analysis");
                                }}
                            />
                        )}

                        {view === "lab" && <LabScreen />}

                        {view === "gemini" && <GeminiScreen />}

                        {view === "account" && <AccountScreen history={history} />}
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
