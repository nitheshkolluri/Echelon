"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users, Shield } from "lucide-react";

type Props = {
  history: any[];
};

const AccountScreen: React.FC<Props> = ({ history }) => {
  return (
    <motion.div
      key="account"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-3xl mx-auto px-6 py-20"
    >
      <h1 className="text-4xl font-black mb-2">Researcher Analytics</h1>
      <p className="text-gray-400 mb-12">Manage your researcher identity and compliance settings.</p>

      <div className="space-y-4">
        <div className="p-6 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-emerald-500 flex items-center justify-center font-bold">
              E
            </div>
            <div>
              <div className="font-bold">Explorer</div>
              <div className="text-xs text-gray-500">guest@echelon.ai</div>
            </div>
          </div>

          <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black text-emerald-400 uppercase tracking-widest">
            HACKATHON ACCESS
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-6 bg-white/5 border border-white/5 rounded-2xl">
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Simulations Run</div>
            <div className="text-3xl font-black">{history.length}</div>
          </div>

          <div className="p-6 bg-white/5 border border-white/5 rounded-2xl">
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Market Coverage</div>
            <div className="text-3xl font-black">
              {Array.from(new Set(history.map((h: any) => h.region))).length}
            </div>
          </div>
        </div>

        <div className="p-8 border border-white/5 bg-white/5 rounded-3xl">
          <h3 className="font-bold mb-6 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            Project Architects
          </h3>

          <div className="grid grid-cols-2 gap-6">
            <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
              <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Lead Architect</div>
              <div className="font-bold text-sm">Nithesh Kolluri</div>
            </div>

            <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
              <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Core Developer</div>
              <div className="font-bold text-sm">Tanvir Rahman Taiyeb</div>
            </div>
          </div>
        </div>

        <div className="p-8 border border-white/5 bg-white/5 rounded-3xl">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            Data Privacy &amp; Hackathon Compliance
          </h3>

          <div className="space-y-4 text-xs text-gray-400 leading-relaxed">
            <p>
              By using Echelon, you agree to the Google Gemini 3 Hackathon official rules. Your simulation data is stored
              locally in your browser cache to ensure privacy.
            </p>

            <ul className="space-y-2">
              <li className="flex gap-2">
                <div className="w-1 h-1 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                Personal data is not transmitted to third-party advertisers.
              </li>

              <li className="flex gap-2">
                <div className="w-1 h-1 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                Simulation logs are cleared upon session termination (Guest Mode).
              </li>

              <li className="flex gap-2">
                <div className="w-1 h-1 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                AI outputs are governed by the Google Generative AI Prohibited Use Policy.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AccountScreen;
