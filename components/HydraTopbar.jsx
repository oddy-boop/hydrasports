'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Search, Menu } from 'lucide-react';
import { useHydraSports } from './HydraContext';

export default function FootyTopbar() {
  const router = useRouter();
  const { searchQuery, setSearchQuery, setSidebarOpen } = useHydraSports();

  return (
    <header className="dashboard-topbar fixed top-3 left-1/2 z-[55] h-[68px] w-[min(860px,calc(100vw-112px))] -translate-x-1/2 px-6 lg:px-8 flex items-center justify-between gap-4 rounded-[20px] border border-slate-200/90 bg-white/90 shadow-[0_14px_35px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="mobile-menu-trigger relative z-[70] flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 lg:hidden"
          aria-label="Open menu"
          aria-expanded={false}
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 max-w-[480px]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                router.push(`/teams/${encodeURIComponent(searchQuery.trim())}`);
              }
            }}
            placeholder="Search clubs, matches, leagues..."
            className="w-full h-[38px] pl-10 pr-4 rounded-full bg-slate-100/80 hover:bg-white focus:bg-white text-[12px] text-slate-900 placeholder-slate-400 border border-slate-200 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-medium"
          />
        </div>

      </div>

      <span className="hidden sm:block text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Search teams</span>
    </header>
  );
}
