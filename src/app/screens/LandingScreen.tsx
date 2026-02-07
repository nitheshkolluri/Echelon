"use client";

import React from "react";
import { motion } from "framer-motion";
import { BrainCircuit, MapPin, ArrowRight } from "lucide-react";

type Props = {
  idea: string;
  setIdea: (v: string) => void;

  region: string;
  setRegion: (v: string) => void;

  duration: number;
  setDuration: (v: number) => void;

  startSimulation: () => void;
  isLoading: boolean;
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const LandingScreen: React.FC<Props> = ({
  idea,
  setIdea,
  region,
  setRegion,
  duration,
  setDuration,
  startSimulation,
  isLoading,
}) => {
  const handleDurationChange = (raw: string) => {
    // Allow user to clear the field without crashing
    if (raw.trim() === "") {
      setDuration(0);
      return;
    }

    const n = Number(raw);

    // Guard against NaN (and weird cases)
    if (!Number.isFinite(n)) {
      setDuration(0);
      return;
    }

    // Keep it clean: whole months + clamp to a reasonable range
    setDuration(clamp(Math.floor(n), 1, 60));
  };

  const canStart =
    !isLoading &&
    idea.trim().length > 0 &&
    region.trim().length > 0 &&
    Number.isFinite(duration) &&
    duration >= 1;

  return (
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
            <label className="text-xs font-bold text-indigo-400 uppercase tracking-[0.2em] mb-4 block">
              1. The Concept
            </label>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="e.g., A boutique organic vineyard experience in the Barossa Valley focusing on sustainable tourism..."
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-xl text-white placeholder:text-gray-700 min-h-[140px] focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <label className="text-xs font-bold text-indigo-400 uppercase tracking-[0.2em] mb-4 block">
                2. Target Region
              </label>
              <div className="relative">
                <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="Sydney CBD, Australia"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white placeholder:text-gray-700 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-indigo-400 uppercase tracking-[0.2em] mb-4 block">
                3. Duration (Months)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={Number.isFinite(duration) && duration > 0 ? duration : ""}
                  onChange={(e) => handleDurationChange(e.target.value)}
                  placeholder="24"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 px-6 text-white focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                />

                <p className="mt-2 text-[11px] text-gray-500 font-bold uppercase tracking-widest">
                  Range: 1–60 months
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={startSimulation}
            disabled={!canStart}
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
  );
};

export default LandingScreen;
