'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useHydraSports } from './HydraContext';
import { ChevronDown, Trophy, Globe, Flame, X, Layers, Calendar, Star, Zap, Tv, Radio } from 'lucide-react';

export const REGIONAL_LEAGUES = [
  { id: 'Champions League', name: 'Champions League', icon: '⚽', color: '#3b82f6', category: 'regional' },
  { id: 'Europa League', name: 'Europa League', icon: '🏆', color: '#f97316', category: 'regional' },
  { id: 'Premier League', name: 'Premiere League', icon: '🦁', color: '#8b5cf6', category: 'regional' },
  { id: 'La Liga', name: 'LaLiga Santander', icon: '🇪🇸', color: '#eab308', category: 'regional' },
  { id: 'Serie A', name: 'SerieA Italian', icon: '🇮🇹', badgeIcon: 'A', color: '#06b6d4', category: 'regional' },
  { id: 'Ligue 1', name: 'League 1 France', icon: '🇫🇷', color: '#10b981', category: 'regional' },
  { id: 'Bundesliga', name: 'Bundesliga Germany', icon: '🇩🇪', color: '#ef4444', category: 'regional' },
  { id: 'Brasileiro', name: 'Brasileiro Série A', icon: '🇧🇷', color: '#22c55e', category: 'regional' },
  { id: 'SAF Primera', name: 'SAF Primera Division', icon: '🇦🇷', color: '#38bdf8', category: 'regional' },
  { id: 'Eredivisie', name: 'Dutch Eredivise', icon: '🇳🇱', color: '#f43f5e', category: 'regional' },
  { id: 'MLS', name: 'Major League Soccer', icon: '🇺🇸', color: '#6366f1', category: 'regional' },
];

export const INTERNATIONAL_LEAGUES = [
  { id: 'World Cup 2026', name: 'World Cup 2026 Qualifiers', icon: '🌍', color: '#fbbf24', category: 'international' },
  { id: 'Nations League', name: 'UEFA Nations League', icon: '🇪🇺', color: '#3b82f6', category: 'international' },
  { id: 'Copa America', name: 'Copa América', icon: '🌎', color: '#f59e0b', category: 'international' },
  { id: 'Asian Cup', name: 'AFC Asian Cup', icon: '🌏', color: '#ec4899', category: 'international' },
  { id: 'International Friendlies', name: 'Intl Friendlies', icon: '🌐', color: '#10b981', category: 'international' },
];

export default function FootySidebar() {
  const pathname = usePathname();
  const {
    selectedLeague = 'Serie A',
    selectLeague,
    sidebarOpen,
    setSidebarOpen,
  } = useHydraSports();

  const [regionalOpen, setRegionalOpen] = useState(true);
  const [intlOpen, setIntlOpen] = useState(true);

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

  const handleSelect = (leagueId) => {
    selectLeague(leagueId);
    setSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-[68px] bottom-0 left-0 z-50 w-[240px] shrink-0 bg-[#141221] p-4 lg:p-5 border-r border-white/[0.06] flex flex-col justify-between transition-transform duration-300 h-[calc(100vh-68px)] overflow-y-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        aria-label="Leagues navigation"
      >
        <div className="space-y-6">
          {/* Close button on mobile */}
          <div className="flex items-center justify-between lg:hidden mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">Navigation</span>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Primary Platform Menu (Unhiding Multi-Stream, Schedule, Favourites, API Hub) */}
          <div>
            <div className="px-2 mb-2 text-[11px] font-black uppercase tracking-wider text-slate-400">
              Platform
            </div>
            <nav className="flex flex-col space-y-1">
              {[
                { href: '/', label: 'Live Matches', icon: Tv, highlight: pathname === '/' },
                { href: '/multistream', label: 'Multi-Stream', icon: Layers, highlight: pathname === '/multistream', badge: 'Quad' },
                { href: '/schedule', label: 'Kickoff Schedule', icon: Calendar, highlight: pathname === '/schedule' },
                { href: '/favourites', label: 'Pinned Clubs', icon: Star, highlight: pathname === '/favourites' },
                { href: '/competitions', label: 'Competitions', icon: Trophy, highlight: pathname === '/competitions' },
                { href: '/api-hub', label: 'Stream API Hub', icon: Zap, highlight: pathname === '/api-hub' },
              ].map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`min-h-[38px] text-xs font-semibold py-2 px-3 rounded-xl transition-all duration-200 flex items-center justify-between group ${
                      item.highlight
                        ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30'
                        : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <IconComponent className={`w-4 h-4 shrink-0 ${item.highlight ? 'text-white' : 'text-purple-400 group-hover:text-purple-300'}`} />
                      <span className="truncate text-[12px]">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Section 1: Regional Leagues (Image 1) */}
          <div>
            <button
              type="button"
              onClick={() => setRegionalOpen(!regionalOpen)}
              className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-300 hover:text-white px-2 py-1.5 mb-2 rounded-lg transition-colors cursor-pointer group"
            >
              <span className="flex items-center gap-2">
                <span className="text-[12px] font-extrabold tracking-wide text-slate-200">Regional Leagues</span>
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform duration-200 ${regionalOpen ? 'rotate-0' : '-rotate-90'}`} />
            </button>

            {regionalOpen && (
              <nav className="flex flex-col space-y-1">
                {REGIONAL_LEAGUES.map((league) => {
                  const isSelected = (selectedLeague || 'Serie A').toLowerCase().includes(league.id.toLowerCase()) ||
                    league.name.toLowerCase().includes((selectedLeague || 'Serie A').toLowerCase());

                  return (
                    <button
                      key={league.id}
                      type="button"
                      onClick={() => handleSelect(league.id)}
                      className={`min-h-[38px] text-left text-xs font-medium py-2 px-3 rounded-xl transition-all duration-200 flex items-center justify-between group cursor-pointer ${
                        isSelected
                          ? 'bg-[#252336] text-white font-bold shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {league.badgeIcon ? (
                          <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-black ${
                            isSelected ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-300'
                          }`}>
                            {league.badgeIcon}
                          </span>
                        ) : (
                          <span className="text-xs select-none">{league.icon}</span>
                        )}
                        <span className="truncate text-[12px]">{league.name}</span>
                      </div>
                    </button>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Section 2: International Leagues (Image 1) */}
          <div>
            <button
              type="button"
              onClick={() => setIntlOpen(!intlOpen)}
              className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-300 hover:text-white px-2 py-1.5 mb-2 rounded-lg transition-colors cursor-pointer group"
            >
              <span className="flex items-center gap-2">
                <span className="text-[12px] font-extrabold tracking-wide text-slate-200">International</span>
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform duration-200 ${intlOpen ? 'rotate-0' : '-rotate-90'}`} />
            </button>

            {intlOpen && (
              <nav className="flex flex-col space-y-1">
                {INTERNATIONAL_LEAGUES.map((league) => {
                  const isSelected = (selectedLeague || '').toLowerCase().includes(league.id.toLowerCase());

                  return (
                    <button
                      key={league.id}
                      type="button"
                      onClick={() => handleSelect(league.id)}
                      className={`min-h-[38px] text-left text-xs font-medium py-2 px-3 rounded-xl transition-all duration-200 flex items-center justify-between group cursor-pointer ${
                        isSelected
                          ? 'bg-[#252336] text-white font-bold shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xs select-none">{league.icon}</span>
                        <span className="truncate text-[12px]">{league.name}</span>
                      </div>
                    </button>
                  );
                })}
              </nav>
            )}
          </div>
        </div>

        {/* Bottom Status Indicator */}
        <div className="pt-4 border-t border-white/[0.06] mt-4 flex items-center gap-2 px-2 text-[11px] text-slate-400 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-time Stream Engine</span>
        </div>
      </aside>
    </>
  );
}
