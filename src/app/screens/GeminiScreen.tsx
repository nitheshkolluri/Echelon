"use client";

import React from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

const GeminiScreen: React.FC = () => {
  return (
    <motion.div
      key="gemini"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto px-6 py-20 text-center"
    >
      <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-indigo-500/20">
        <Zap className="text-white w-12 h-12" fill="white" />
      </div>

      <h1 className="text-5xl font-black mb-6">Gemini 2.0 Flash Core</h1>

      <p className="text-gray-400 text-lg mb-12 max-w-2xl mx-auto">
        Echelon is powered by Google&apos;s latest frontier model, enabling real-time agentic reasoning and high-fidelity
        market simulations.
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
  );
};

export default GeminiScreen;
