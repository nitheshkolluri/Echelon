"use client";

import React from "react";
import { motion } from "framer-motion";
import { Activity, Database, Terminal } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import type { MarketState } from "@/lib/types";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6"];

type Props = {
  progress: number;
  logs: string[];
  marketState: MarketState | null;
};

const SimulationScreen: React.FC<Props> = ({ progress, logs, marketState }) => {
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