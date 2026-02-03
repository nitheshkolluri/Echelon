import React from 'react';
import {
    BarChart3, Users, Zap, Settings, HelpCircle, LogOut,
    ChevronLeft, ChevronRight, LayoutDashboard, History
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SidebarProps {
    isOpen: boolean;
    toggle: () => void;
    user: any;
    onLogout?: () => void;
    currentView: string;
    onNavigate: (view: any) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggle, user, onLogout, currentView, onNavigate }) => {
    const menuItems = [
        { id: 'landing', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'history', icon: History, label: 'Sim History' },
        { id: 'lab', icon: BarChart3, label: 'Market Lab' },
        { id: 'gemini', icon: Zap, label: 'Gemini 2.0' },
        { id: 'account', icon: Settings, label: 'Account' },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={toggle}
                />
            )}

            <motion.aside
                initial={false}
                animate={{ width: isOpen ? 280 : 80 }}
                className={`fixed inset-y-0 left-0 bg-[#0d0d0d] border-r border-white/5 z-50 flex flex-col transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                    }`}
            >
                {/* Toggle Button */}
                <button
                    onClick={toggle}
                    className="absolute -right-3 top-20 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-lg md:flex hidden hover:scale-110 transition-transform"
                >
                    {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                </button>

                {/* Logo */}
                <div className="h-20 flex items-center px-6 overflow-hidden">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/10 shrink-0 border border-white/5 relative group cursor-pointer" onClick={() => onNavigate('landing')}>
                        <img src="/logo.png" alt="Echelon Logo" className="w-8 h-8 object-contain" />
                        <div className="absolute inset-0 bg-indigo-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {isOpen && (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="ml-4 font-black text-xl tracking-tighter bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent"
                        >
                            ECHELON
                        </motion.span>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 mt-6 px-3 space-y-2">
                    {menuItems.map((item) => {
                        const active = currentView === item.id || (item.id === 'landing' && ['setup', 'simulation', 'analysis'].includes(currentView));
                        return (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.id)}
                                className={`w-full flex items-center h-12 rounded-xl transition-all duration-200 group ${active ? 'bg-indigo-500/10 text-indigo-400' : 'text-gray-500 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <div className="w-14 flex items-center justify-center shrink-0">
                                    <item.icon size={22} strokeWidth={active ? 2.5 : 2} />
                                </div>
                                {isOpen && (
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="font-bold text-sm tracking-wide"
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Bottom Area */}
                <div className="p-4 border-t border-white/5 space-y-4">
                    <div
                        onClick={() => onNavigate('account')}
                        className={`p-2 bg-white/5 rounded-2xl flex items-center gap-3 transition-all cursor-pointer hover:bg-white/10 ${!isOpen && 'justify-center border-transparent'} border border-white/5 group`}
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-emerald-500 flex items-center justify-center font-black text-xs shrink-0 ring-1 ring-white/10 uppercase group-hover:ring-indigo-500/50 transition-all">
                            {user.name[0]}
                        </div>
                        {isOpen && (
                            <div className="min-w-0">
                                <p className="font-bold text-sm truncate group-hover:text-indigo-400 transition-colors">{user.name}</p>
                                <p className="text-[9px] text-emerald-400 font-black uppercase tracking-[0.15em]">ACTIVE NODE</p>
                            </div>
                        )}
                    </div>
                </div>

            </motion.aside>
        </>
    );
};


