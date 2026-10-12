'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useHydraSports } from './HydraContext';
import { Radio, Layers, Database, Trophy, Calendar, Star, Compass, History, X } from 'lucide-react';
import { COMPETITIONS_LIST } from './leagueMatcher';

export default function FootySidebar() {
  const {
    activeMenu,
    selectMenu,
    selectedLeague,
    selectLeague,
    sidebarOpen,
    setSidebarOpen,
    favouriteTeams,
  } = useHydraSports();

  const menuItems = [
    { id: 'live', label: 'Live Now', icon: Radio, isLivePulse: true },
    { id: 'explore', label: 'Explore Fixtures', icon: Compass },
    { id: 'schedule', label: 'Today\'s Schedule', icon: Calendar },
    { id: 'results', label: 'Past Results', icon: History },
    { id: 'competitions', label: 'Competitions', icon: Trophy },
    { id: 'favourites', label: 'Favourite Teams', icon: Star, badgeCount: favouriteTeams.length },
  ];

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [sidebarOpen, setSidebarOpen]);

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`sidebar-rail fixed top-0 bottom-0 left-0 z-50 w-[220px] shrink-0 bg-white p-6 lg:p-7 border-r border-slate-200/80 flex flex-col justify-between transition-[width,transform] duration-300 h-screen max-h-screen ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        aria-label="Sports navigation"
      >
        <div className="sidebar-scroll-area min-h-0 overflow-y-auto pr-1">
          {/* Brand Logo lockup */}
          <Link
            href="/"
            onClick={() => selectMenu('live')}
            className="flex items-center gap-2.5 mb-8 group"
          >
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="m4.93 4.93 4.24 4.24" />
                <path d="m14.83 9.17 4.24-4.24" />
                <path d="m14.83 14.83 4.24 4.24" />
                <path d="m9.17 14.83-4.24 4.24" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </span>
            <div className="sidebar-brand-copy">
              <span className="text-[19px] font-black tracking-tight text-slate-900 block leading-tight">
                Hydra<span className="text-emerald-600">Sport</span>
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                Live Sports
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Section: MENU */}
          <div className="mb-6">
            <h3 className="sidebar-copy text-[10px] font-black tracking-[0.16em] text-slate-400 uppercase mb-3 px-1">
              Menu
            </h3>
            <nav className="flex flex-col space-y-1">
              {menuItems.map((item) => {
                const isActive = activeMenu === item.id;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.id === 'live' ? '/' : `/${item.id}`}
                    onClick={() => {
                      selectMenu(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`relative min-h-11 text-left text-[12.5px] font-bold py-2.5 px-2.5 rounded-xl transition-all duration-200 flex items-center justify-between group cursor-pointer ${
                      isActive
                        ? 'text-emerald-700 bg-emerald-50 shadow-xs ring-1 ring-emerald-200/60'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      <span className="sidebar-copy">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.badgeCount !== undefined && item.badgeCount > 0 && (
                        <span className="sidebar-copy text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                          {item.badgeCount}
                        </span>
                      )}

                      {item.isLivePulse && (
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                      )}

                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Section: TOP LEAGUES */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="sidebar-copy text-[10px] font-black tracking-[0.16em] text-slate-400 uppercase">
                Top Leagues
              </h3>
              {selectedLeague !== 'All' && (
                <button
                  type="button"
                  onClick={() => selectLeague('All')}
                  className="text-[9.5px] font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                >
                  <span className="sidebar-copy">Reset</span>
                </button>
              )}
            </div>
            <nav className="flex flex-col space-y-1">
              {COMPETITIONS_LIST.map((league) => {
                const isSelected = selectedLeague === league.id;
                return (
                  <button
                    key={league.id}
                    type="button"
                    onClick={() => selectLeague(league.id)}
                    className={`min-h-10 text-left text-[12px] font-semibold py-2 px-2.5 rounded-xl transition-all duration-200 flex items-center justify-between group cursor-pointer ${
                      isSelected
                        ? 'text-emerald-800 bg-emerald-50/90 font-bold ring-1 ring-emerald-300/80 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm select-none">{league.flag}</span>
                      <span className="sidebar-copy truncate">{league.name}</span>
                    </div>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Live Streaming Engine quick access */}
        <div className="pt-4 border-t border-slate-200/80 mt-4 space-y-2">
          <div className="flex items-center gap-2 px-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50/80 py-1.5 rounded-lg border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="sidebar-copy">3 Stream Servers Online</span>
          </div>

          <div className="flex flex-col gap-1 text-[11px] font-bold text-slate-600">
            <Link
              href="/multistream"
              className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-all"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span className="sidebar-copy">Multi-view Arena</span>
            </Link>
            <Link
              href="/api-hub"
              className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-all"
            >
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <span className="sidebar-copy">API Engine Hub</span>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
