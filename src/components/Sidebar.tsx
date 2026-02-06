"use client";

import React from "react";
import {
  BarChart3,
  Zap,
  Settings,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  History,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type AppView =
  | "landing"
  | "setup"
  | "simulation"
  | "analysis"
  | "history"
  | "lab"
  | "gemini"
  | "account";

type User = {
  name: string;
  tier?: string;
  email?: string;
};

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
  user: User;
  currentView: AppView;
  onNavigate: (view: AppView) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  toggle,
  user,
  currentView,
  onNavigate,
}) => {
  const menuItems: Array<{
    id: AppView;
    icon: React.ElementType;
    label: string;
  }> = [
    { id: "landing", icon: LayoutDashboard, label: "Dashboard" },
    { id: "history", icon: History, label: "Sim History" },
    { id: "lab", icon: BarChart3, label: "Market Lab" },
    { id: "gemini", icon: Zap, label: "Gemini 2.0" },
    { id: "account", icon: Settings, label: "Account" },
  ];

  const isLandingGroup = (view: AppView) =>
    view === "landing" ||
    view === "setup" ||
    view === "simulation" ||
    view === "analysis";

  const handleNavigate = (view: AppView) => {
    onNavigate(view);

    // Mobile UX: close after navigating
    if (typeof window !== "undefined" && window.innerWidth < 768 && isOpen) {
      toggle();
    }
  };

  const safeInitial = (user?.name?.trim()?.[0] ?? "E").toUpperCase();

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.button
            type="button"
            aria-label="Close sidebar"
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            onClick={toggle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: isOpen ? 280 : 80 }}
        className={`fixed inset-y-0 left-0 bg-[#0d0d0d] border-r border-white/5 z-50 flex flex-col transition-all duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Subtle background glow (premium) */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full" />
          <div className="absolute bottom-0 left-10 w-72 h-72 bg-emerald-500/5 blur-3xl rounded-full" />
        </div>

        {/* Toggle Button (desktop only) */}
        <button
          type="button"
          onClick={toggle}
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          className="absolute -right-3 top-20 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-lg md:flex hidden hover:scale-110 transition-transform"
        >
          {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* Logo */}
        <div className="h-20 flex items-center px-6 overflow-hidden relative z-10">
          <button
            type="button"
            onClick={() => handleNavigate("landing")}
            aria-label="Go to dashboard"
            className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/10 shrink-0 border border-white/5 relative group"
          >
            <img
              src="/logo.png"
              alt="Echelon Logo"
              className="w-8 h-8 object-contain"
            />
            <div className="absolute inset-0 bg-indigo-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          {isOpen && (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              className="ml-4 flex flex-col"
            >
              <span className="font-black text-xl tracking-tighter bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent leading-none">
                ECHELON
              </span>
              {/* Premium badge */}
              <span className="mt-1 inline-flex w-fit items-center gap-2 px-2 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black uppercase tracking-[0.2em] text-indigo-300/90">
                HACKATHON • BETA
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-400" />
                </span>
              </span>
            </motion.div>
          )}
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 mt-6 px-3 space-y-2 relative z-10"
          aria-label="Primary navigation"
        >
          {menuItems.map((item) => {
            const active =
              item.id === "landing"
                ? isLandingGroup(currentView)
                : currentView === item.id;

            const Icon = item.icon;

            return (
              <div key={item.id} className="relative group">
                {/* Active glow bar (left) */}
                <AnimatePresence>
                  {active && (
                    <motion.div
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-1 rounded-full bg-indigo-400 shadow-[0_0_18px_rgba(99,102,241,0.65)]"
                    />
                  )}
                </AnimatePresence>

                <button
                  type="button"
                  onClick={() => handleNavigate(item.id)}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  className={`w-full flex items-center h-12 rounded-xl transition-all duration-200 relative overflow-hidden ${
                    active
                      ? "text-indigo-200"
                      : "text-gray-500 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {/* Animated active pill background */}
                  <AnimatePresence>
                    {active && (
                      <motion.div
                        layoutId="sidebar-active-pill"
                        className="absolute inset-0 bg-gradient-to-r from-indigo-500/18 via-indigo-500/10 to-transparent border border-indigo-500/15 rounded-xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </AnimatePresence>

                  <div className="w-14 flex items-center justify-center shrink-0 relative z-10">
                    <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                  </div>

                  {isOpen && (
                    <motion.span
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="font-bold text-sm tracking-wide relative z-10"
                    >
                      {item.label}
                    </motion.span>
                  )}

                  {/* Active dot */}
                  {active && (
                    <div className="ml-auto mr-3 w-1.5 h-1.5 rounded-full bg-indigo-300 relative z-10" />
                  )}
                </button>

                {/* Tooltip when collapsed */}
                {!isOpen && (
                  <div className="hidden md:block pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="px-3 py-1 rounded-lg bg-black/80 border border-white/10 text-xs font-bold text-gray-200 whitespace-nowrap">
                      {item.label}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom Area */}
        <div className="p-4 border-t border-white/5 space-y-4 relative z-10">
          <button
            type="button"
            onClick={() => handleNavigate("account")}
            aria-label="Open account"
            className={`w-full p-2 rounded-2xl flex items-center gap-3 transition-all cursor-pointer border border-white/5 group relative overflow-hidden ${
              !isOpen ? "justify-center border-transparent" : ""
            } hover:border-indigo-500/20`}
          >
            {/* Premium hover wash */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-emerald-500 flex items-center justify-center font-black text-xs shrink-0 ring-1 ring-white/10 uppercase group-hover:ring-indigo-500/50 transition-all relative z-10">
              {safeInitial}
            </div>

            {isOpen && (
              <div className="min-w-0 text-left relative z-10">
                <p className="font-bold text-sm truncate group-hover:text-indigo-200 transition-colors">
                  {user?.name ?? "Explorer"}
                </p>
                <p className="text-[9px] text-emerald-400 font-black uppercase tracking-[0.15em]">
                  ACTIVE NODE
                </p>
              </div>
            )}
          </button>
        </div>
      </motion.aside>
    </>
  );
};
