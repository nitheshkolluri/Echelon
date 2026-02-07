"use client";

import React from "react";
import { motion } from "framer-motion";
import { Activity, Database, Terminal, AlertTriangle, ArrowLeft } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import type { MarketState } from "@/lib/types";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6"];

type Props = {
  progress: number;
  logs: string[];
  marketState: MarketState | null;
  error?: string | null;
  onReset?: () => void;
};

const SimulationScreen: React.FC<Props> = ({ progress, logs, marketState, error, onReset }) => {
  return (
    <motion.div
      key="simulation"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 h-full flex flex-col gap-6 overflow-hidden"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Terminal className="text-emerald-400" />
          Simulation in Progress
        </h2>
        <div className={`px-4 py-2 ${error ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'} border rounded-xl text-sm font-bold ${!error && 'animate-pulse'}`}>
          {error ? 'SIMULATION CORE FAILURE' : 'ACTIVE LIVE NODE'}
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-500/10 border border-red-500/20 p-8 rounded-[2rem] text-red-100 flex flex-col md:flex-row items-center gap-6"
        >
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h4 className="font-black uppercase tracking-widest text-xs text-red-500 mb-2">Protocol Failure: Strategic Validation</h4>
            <p className="font-medium text-lg leading-relaxed mb-4">{error}</p>
            <button
              onClick={onReset}
              className="px-6 py-2 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-colors flex items-center gap-2 mx-auto md:mx-0"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Mission Control
            </button>
          </div>
        </motion.div>
      )}

      {!error && (
        <div className="w-full bg-white/5 rounded-full h-4 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500"
          />
        </div>
      )}

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
                <AreaChart data={marketState.agents[0]?.history ?? []}>
                  {marketState.agents.map((agent, i) => (
                    <Area
                      key={agent.id}
                      type="monotone"
                      dataKey="share"
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
  );
};

export default SimulationScreen;