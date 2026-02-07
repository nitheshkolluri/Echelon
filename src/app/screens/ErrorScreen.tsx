"use client";

import React from "react";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";

type Props = {
    message: string;
    onReset: () => void;
};

const ErrorScreen: React.FC<Props> = ({ message, onReset }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="min-h-[80vh] flex items-center justify-center p-6"
        >
            <div className="max-w-xl w-full">
                <div className="bg-[#121212] border border-red-500/20 rounded-[2.5rem] p-12 shadow-2xl relative overflow-hidden text-center">
                    {/* Background Highlight */}
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-red-500/10 blur-[100px] pointer-events-none" />
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/10 blur-[100px] pointer-events-none" />

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-8">
                            <AlertCircle className="w-10 h-10 text-red-500" />
                        </div>

                        <h2 className="text-3xl font-black mb-4 text-white uppercase tracking-tight">
                            Simulation Halted
                        </h2>

                        <div className="bg-black/40 border border-white/5 rounded-2xl p-6 mb-10 w-full">
                            <p className="text-lg text-gray-400 font-medium leading-relaxed">
                                {message}
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 w-full">
                            <button
                                onClick={onReset}
                                className="flex-1 bg-white text-black font-black py-4 px-8 rounded-2xl hover:bg-gray-200 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Return to Mission Control
                            </button>

                            <button
                                onClick={() => window.location.reload()}
                                className="flex-1 bg-white/5 text-white font-bold py-4 px-8 rounded-2xl hover:bg-white/10 border border-white/10 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Reboot System
                            </button>
                        </div>

                        <p className="mt-8 text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em]">
                            Error Code: ECHELON_VAL_01 • Strategy Integrity Failure
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ErrorScreen;
