"use client";

import React from "react";
import { motion } from "framer-motion";
import { BarChart3, Info } from "lucide-react";

const LabScreen: React.FC = () => {
  return (
    <motion.div
      key="lab"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
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
            <strong>Hackathon Showcase Mode:</strong> The Market Lab demonstrates Echelon&apos;s potential for
            enterprise-grade diagnostics. While the core simulation handles standard market dynamics, these Lab modules
            are currently in tech-demo status to showcase the planned roadmap for high-frequency trading and
            psychological consumer profiling features.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {[
          { title: "Sentiment Sandbox", desc: "Simulate extreme shifts in consumer confidence and social media movements." },
          { title: "Competitor Archetypes", desc: "Design custom AI agents with specific strategic biases and budget constraints." },
          { title: "Global Shock Sim", desc: "Test resilience against simulated supply chain crises or economic shocks." },
          { title: "Niche Deep-Dive", desc: "Analyze micro-segments within larger regional markets for targeted entries." },
        ].map((item, i) => (
          <div
            key={i}
            className="p-8 bg-white/5 border border-white/5 rounded-3xl group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4">
              <div className="px-2 py-1 bg-white/5 rounded text-[8px] font-black uppercase tracking-widest text-gray-500">
                Coming Soon
              </div>
            </div>
            <h3 className="font-bold mb-2 text-gray-300 transition-colors">{item.title}</h3>
            <p className="text-sm text-gray-500">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-20 pt-12 border-t border-white/5">
        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-600 mb-8">AI Disclaimer &amp; Ethics</h3>
        <div className="grid md:grid-cols-2 gap-12 text-xs text-gray-500 leading-relaxed">
          <p>
            Echelon leverages large language models (Gemini 2.0 Flash) to simulate complex human behaviors and strategic
            decisions. While highly sophisticated, these simulations are based on probabilistic modeling and should not
            be used as the sole basis for multi-million dollar capital investments without human professional
            consultation.
          </p>
          <p>
            All market data generated is synthetic and intended for strategic experimentation. Echelon does not store or
            process real-world consumer PII (Personally Identifiable Information) during its simulation cycles, adhering
            to strict data privacy standards for the Google Gemini 3 Hackathon.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default LabScreen;
