'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Menu, Search, User, Layers, Radio, X, ChevronDown } from 'lucide-react';
import { useHydraSports } from './HydraContext';
import { useAuth } from './AuthContext';
import { normalizeSport } from './leagueMatcher';

export default function FootyTopbar() {
  const router = useRouter();
  const {
    setSidebarOpen,
    activeSport = 'Football',
    setActiveSport,
    searchQuery,
    setSearchQuery,
  } = useHydraSports();
  const { user } = useAuth();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [liveMatches, setLiveMatches] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);

  const sports = ['Football', 'Tennis', 'Basket Ball', 'Hockey'];

  // Fetch real live matches for notifications
  useEffect(() => {
    let cancelled = false;
    const fetchLive = async () => {
      try {
        const res = await fetch('/api/matches', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data.matches)) {
          const live = data.matches.filter((m) => m.status === 'live');
          setLiveMatches(live);
        }
      } catch {}
    };

    fetchLive();
    const interval = setInterval(fetchLive, 20000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-[60] h-[68px] w-full px-3 sm:px-6 lg:px-8 flex items-center justify-between border-b border-white/[0.06] bg-[#141221] backdrop-blur-xl">
        {/* Left: Brand Logo (HydraSports) & Mobile Trigger */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/" className="flex items-center gap-2 group min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6366f1] via-[#8b5cf6] to-[#ec4899] flex items-center justify-center text-white shadow-[0_4px_16px_rgba(124,58,237,0.35)] group-hover:scale-105 transition-transform shrink-0">
              <Radio className="w-4 h-4 text-white" />
            </div>
            <span className="text-[16px] sm:text-[17px] font-black tracking-tight text-white flex items-center truncate">
              Hydra<span className="text-[#a78bfa]">Sports</span>
            </span>
          </Link>
        </div>

        {/* Center: Sports Category Tabs that actually filter real data */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          {sports.map((sport) => {
            const isActive = normalizeSport(activeSport || 'Football') === normalizeSport(sport);
            return (
              <button
                key={sport}
                type="button"
                onClick={() => {
                  if (setActiveSport) setActiveSport(sport);
                }}
                className={`relative px-4 py-2 text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{sport}</span>
                {isActive && (
                  <span className="absolute bottom-[-18px] left-0 right-0 h-[3px] bg-[#8b5cf6] rounded-full shadow-[0_0_12px_rgba(139,92,246,0.8)]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Controls: Search, Multi-Stream, Notifications, Profile */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 justify-end">
        {/* Real Live Search Input */}
        <div className="relative">
          {searchOpen ? (
            <div className="flex items-center gap-1 bg-[#1c1a2d] border border-white/15 rounded-xl px-2.5 py-1">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search clubs, sports..."
                value={searchQuery || ''}
                onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                className="w-32 sm:w-48 bg-transparent text-xs text-white placeholder-slate-500 outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  if (setSearchQuery) setSearchQuery('');
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
              title="Search matches"
            >
              <Search className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Multi-Stream Button (Prominently unhidden!) */}
        <Link
          href="/multistream"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition-all hover:scale-105 shrink-0"
          title="Watch up to 4 live streams concurrently"
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Multi-Stream</span>
        </Link>

        {/* Real Notifications Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            aria-label="Notifications"
            className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {liveMatches.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ef4444] ring-2 ring-[#141221]" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-[#181628] border border-white/15 p-3 shadow-2xl z-50 animate-fade-in text-white">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                <span className="text-xs font-extrabold text-white">Live Broadcast Alerts</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30">
                  {liveMatches.length} Live
                </span>
              </div>

              {liveMatches.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  No matches currently in progress. Upcoming games will appear here.
                </p>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-1.5">
                  {liveMatches.slice(0, 5).map((match) => (
                    <Link
                      key={match.id}
                      href={`/watch/${match.id}`}
                      onClick={() => setNotificationsOpen(false)}
                      className="block p-2 rounded-xl bg-[#1e1c32] hover:bg-[#25233e] transition-colors"
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold text-white">
                        <span className="truncate max-w-[180px]">{match.title}</span>
                        <span className="text-emerald-400 font-black tabular-nums">
                          {match.homeScore ?? 0} - {match.awayScore ?? 0}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                        <span>{match.currentMinute || 'Live'}</span>
                        <span>·</span>
                        <span className="truncate">{match.tournament || 'Live fixture'}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>

      {/* Mobile Sports Dropdown (Replaces horizontal scrolling) */}
      <div className="flex md:hidden items-center justify-between gap-2.5 px-3 py-2 bg-[#121020] border-b border-white/[0.06] shrink-0">
        <label htmlFor="mobile-sports-selector" className="text-xs font-black uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
          <span>Sport:</span>
        </label>
        <div className="relative flex-1">
          <select
            id="mobile-sports-selector"
            value={activeSport || 'Football'}
            onChange={(e) => {
              if (setActiveSport) setActiveSport(e.target.value);
            }}
            className="w-full h-8 px-3 pr-8 rounded-lg bg-[#1c1a2d] border border-white/15 text-xs font-bold text-purple-300 outline-none focus:border-purple-500 cursor-pointer appearance-none shadow-sm"
          >
            {sports.map((sport) => (
              <option key={sport} value={sport} className="bg-[#1c1a2d] text-white">
                {sport}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-purple-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>
    </>
  );
}
