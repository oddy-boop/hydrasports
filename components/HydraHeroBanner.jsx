'use client';

import React from 'react';
import Link from 'next/link';
import { Play, Radio, Users, Shield, Zap } from 'lucide-react';
import { useHydraSports } from './HydraContext';

export default function FootyHeroBanner({ featuredMatch }) {
  const { activeMatch, playMatch } = useHydraSports();
  const [homeBadgeError, setHomeBadgeError] = React.useState(false);
  const [awayBadgeError, setAwayBadgeError] = React.useState(false);

  // Use either the passed featured match or default active match
  const match = featuredMatch || activeMatch || {
    id: '',
    title: 'No live fixture selected',
    tournament: 'Hydra Sport',
    status: 'upcoming',
  };
  const isLive = match.status === 'live';

  return (
    <div className="hydra-hero-banner relative rounded-[28px] overflow-hidden p-6 md:p-8 lg:p-9 bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#0d9488] shadow-[0_20px_50px_rgba(4,120,87,0.22)] text-white select-none transition-all duration-300">
      {/* Stadium pitch lines and spotlight lighting effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(52,211,153,0.25),transparent_50%)] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-teal-400/20 blur-3xl pointer-events-none" />

      {/* Featured team badges */}
      <div className="hydra-hero-teams absolute right-4 top-0 bottom-0 w-[38%] max-w-[280px] pointer-events-none flex items-center justify-center">
        <div className="flex items-center gap-2.5 sm:gap-4">
          {match.homeTeam?.badge && !homeBadgeError ? (
            <img
              src={match.homeTeam.badge}
              alt={match.homeTeam.name || 'Home team'}
              onError={() => setHomeBadgeError(true)}
              className="h-16 w-16 sm:h-24 sm:w-24 rounded-2xl bg-white p-2 object-contain shadow-[0_16px_30px_rgba(6,78,59,0.35)] ring-2 ring-white/50"
            />
          ) : (
            <div className="flex h-16 w-16 sm:h-24 sm:w-24 items-center justify-center rounded-2xl bg-white/95 px-2 text-center text-sm sm:text-lg font-black leading-tight text-emerald-800 shadow-[0_16px_30px_rgba(6,78,59,0.35)] ring-2 ring-white/50">
              {(match.homeTeam?.name || match.homeName || 'Home').slice(0, 3).toUpperCase()}
            </div>
          )}
          <span className="text-lg sm:text-2xl font-black text-white/75">VS</span>
          {match.awayTeam?.badge && !awayBadgeError ? (
            <img
              src={match.awayTeam.badge}
              alt={match.awayTeam.name || 'Away team'}
              onError={() => setAwayBadgeError(true)}
              className="h-16 w-16 sm:h-24 sm:w-24 rounded-2xl bg-white p-2 object-contain shadow-[0_16px_30px_rgba(6,78,59,0.35)] ring-2 ring-white/50"
            />
          ) : (
            <div className="flex h-16 w-16 sm:h-24 sm:w-24 items-center justify-center rounded-2xl bg-white/95 px-2 text-center text-sm sm:text-lg font-black leading-tight text-emerald-800 shadow-[0_16px_30px_rgba(6,78,59,0.35)] ring-2 ring-white/50">
              {(match.awayTeam?.name || match.awayName || 'Away').slice(0, 3).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Left content details */}
      <div className="hydra-hero-content relative z-10 max-w-[65%] sm:max-w-[60%]">
        {/* Live Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[10px] font-black tracking-wider uppercase mb-3 text-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{isLive ? 'FEATURED MATCH • LIVE NOW' : 'NEXT BIG FIXTURE'}</span>
        </div>

        {/* Big Clash Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
          {match.title || 'Marseille vs Troyes'}
        </h1>

        {/* Live Scores and Tournament detail */}
        <div className="flex items-center gap-3 mt-2.5">
          <span className="text-sm sm:text-base font-extrabold text-white">
            {match.tournament || 'Ligue 1'}
          </span>
          <span className="text-white/60">•</span>
          {isLive && (
            <span className="text-xs sm:text-sm font-bold bg-emerald-400/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
              Score: {match.homeScore ?? 1} - {match.awayScore ?? 2} ({match.currentMinute || "67'"})
            </span>
          )}
        </div>

        <p className="text-[11px] sm:text-xs text-emerald-100/85 mt-2 leading-relaxed font-medium max-w-sm">
          Multi-server HD football stream with zero buffering, live scoreboards, lineups, and match stats.
        </p>

        {/* Watch Stream Button & Metadata stats */}
        <div className="flex flex-wrap items-center gap-4 mt-6">
          <Link
            href={`/watch/${match.id || 'troyes-vs-marseille-2489514'}`}
            onClick={() => playMatch(match)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-emerald-50 text-emerald-900 font-extrabold text-xs shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-emerald-800 text-emerald-800" />
            <span>Watch Live Stream</span>
          </Link>

          <div className="flex items-center gap-2 text-[11px] font-semibold text-white/90">
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>1080p 60FPS • 4 Servers Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}
