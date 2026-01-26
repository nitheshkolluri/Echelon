
"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, BrainCircuit, LineChart as LucideLineChart, BarChart3, X, Activity } from 'lucide-react';

export const Sidebar: React.FC<{ activeView: string; onViewChange: (v: any) => void; isOpen: boolean; toggle: () => void }> = ({ activeView, onViewChange, isOpen, toggle }) => {
    const items = [
        { id: 'landing', icon: Globe, label: 'Overview' },
        { id: 'setup', icon: BrainCircuit, label: 'Market Design' },
        { id: 'simulation', icon: LucideLineChart, label: 'Live Simulation' },
        { id: 'analysis', icon: BarChart3, label: 'Final Report' },
    ];

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={toggle} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden" />
                )}
            </AnimatePresence>
            <aside className={`fixed lg:static inset-y-0 left-0 w-64 border-r border-slate-200 flex flex-col bg-white z-50 transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-900 rounded-lg"><BrainCircuit size={20} className="text-white" /></div>
                        <h1 className="font-heading font-bold text-xl tracking-tight text-slate-900">ECHELON</h1>
                    </div>
                    <button onClick={toggle} className="lg:hidden p-2 text-slate-400 hover:text-slate-900"><X size={20} /></button>
                </div>
                <nav className="flex-grow py-8 flex flex-col gap-1 px-4">
                    {items.map((item) => (
                        <button key={item.id} onClick={() => { onViewChange(item.id); toggle(); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeView === item.id ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>
                            <item.icon size={18} strokeWidth={activeView === item.id ? 2.5 : 2} /><span className="text-sm">{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="p-6 mt-auto border-t border-slate-100 flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest"><Activity size={12} className="text-emerald-500" /> System Active</div>
                    <div className="text-[10px] text-slate-400 font-medium">Model v4.2.1-Elite</div>
                </div>
            </aside>
        </>
    );
};
