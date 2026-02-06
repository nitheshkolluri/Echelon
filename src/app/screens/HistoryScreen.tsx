"use client";

import React from "react";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";

type HistoryItem = {
  id: string;
  date: string;
  idea: string;
  region: string;
  marketState: any;
  report: any;
};

type Props = {
  history: HistoryItem[];
  onClear: () => void;
  onOpenItem: (item: HistoryItem) => void;
};

const HistoryScreen: React.FC<Props> = ({ history, onClear, onOpenItem }) => {
  return (
    <motion.div
      key="history"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto px-6 py-20"
    >
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-black mb-2">Simulation Vault</h1>
          <p className="text-gray-400">Review your past market experiments and strategic outcomes.</p>
        </div>

        <button
          onClick={onClear}
          className="text-xs font-bold text-red-500/50 hover:text-red-500 transition-colors uppercase tracking-widest"
        >
          Clear Vault
        </button>
      </div>

      {history.length > 0 ? (
        <div className="grid gap-4">
          {history.map((sim, i) => (
            <div
              key={sim.id ?? String(i)}
              onClick={() => onOpenItem(sim)}
              className="p-6 bg-[#121212] border border-white/10 rounded-3xl hover:border-indigo-500/50 transition-all cursor-pointer group flex items-center justify-between"
            >
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors">
                  <Activity className="text-indigo-400 w-6 h-6" />
                </div>

                <div>
                  <h3 className="font-bold text-lg group-hover:text-indigo-400 transition-colors">
                    {sim.region}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-1 max-w-md">{sim.idea}</p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xl font-black text-emerald-400">
                  {sim.report?.feasibilityScore}/10
                </div>
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
  );
};

export default HistoryScreen;