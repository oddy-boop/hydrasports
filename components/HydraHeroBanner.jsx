'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Play, Calendar, MapPin, Zap } from 'lucide-react';
import { cleanTeamBadgeUrl } from '@/lib/utils/teamLogos';

export default function FootyHeroBanner({ featuredMatch }) {
  const [homeImgError, setHomeImgError] = useState(false);
  const [awayImgError, setAwayImgError] = useState(false);

  // Real featured match data from props
  const match = featuredMatch || {
    id: 'featured-1',
    title: 'Napoli vs Inter Milan',
    tournament: 'Serie A Italian',
    status: 'live',
    timestamp: Date.now(),
    venue: 'Stadio Giuseppe Meazza',
    homeTeam: { name: 'Napoli', badge: 'https://a.espncdn.com/i/teamlogos/soccer/500/114.png' },
    awayTeam: { name: 'Inter Milan', badge: 'https://a.espncdn.com/i/teamlogos/soccer/500/110.png' },
  };

  const homeName = match.homeTeam?.name || 'Napoli';
  const awayName = match.awayTeam?.name || 'Inter Milan';
  const homeBadge = cleanTeamBadgeUrl(match.homeTeam?.badge, homeName);
  const awayBadge = cleanTeamBadgeUrl(match.awayTeam?.badge, awayName);
  const venue = match.venue || 'Giuseppe Meazza';

  const dateStr = new Date(match.timestamp || Date.now()).toLocaleDateString([], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const timeStr = new Date(match.timestamp || Date.now()).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Link
      href={`/watch/${match.id || ''}?tab=live`}
      className="group relative block w-full rounded-[24px] overflow-hidden shadow-2xl border border-white/[0.08] transition-all duration-300 hover:scale-[1.008] cursor-pointer"
      style={{
        background: 'linear-gradient(135deg, #132238 0%, #17334f 35%, #0f243c 70%, #151a2e 100%)',
      }}
    >
      {/* Background Stadium Floodlight Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(56,189,248,0.2),transparent_70%)] pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Banner Grid */}
      <div className="relative z-10 min-h-[190px] sm:min-h-[260px] md:min-h-[280px] p-4 sm:p-8 md:p-10 flex flex-col justify-between">
        
        {/* Top Header: Super Big Match badge */}
        <div className="flex flex-col items-center justify-center text-center space-y-1">
          <span className="text-[12px] sm:text-[14px] font-black text-white tracking-wide drop-shadow-sm">
            Super Big Match
          </span>
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-300 tracking-wider">
            {match.tournament || 'Serie A'}
          </span>
        </div>

        {/* Center: Home Player/Badge - BIG TITLE - Away Player/Badge */}
        <div className="grid grid-cols-12 items-center my-2 sm:my-4 gap-1.5 sm:gap-2">
          
          {/* Home Team Badge / Visual (Left) */}
          <div className="col-span-3 sm:col-span-3 flex items-center justify-center sm:justify-start">
            <div className="relative group-hover:scale-110 transition-transform duration-300">
              {homeBadge && !homeImgError ? (
                <img
                  src={homeBadge}
                  alt={homeName}
                  onError={() => setHomeImgError(true)}
                  className="w-12 h-12 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain rounded-2xl bg-white/10 p-1.5 sm:p-2 border border-white/20 backdrop-blur-md shadow-lg"
                />
              ) : (
                <div className="w-12 h-12 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white font-black text-sm sm:text-lg">
                  {homeName.slice(0, 3).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Center Matchup Headline: NAPOLI VS INTER MILAN */}
          <div className="col-span-6 sm:col-span-6 flex flex-col items-center justify-center text-center px-1">
            <h2 className="text-base sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight uppercase leading-tight drop-shadow-md flex flex-wrap items-center justify-center gap-1 sm:gap-2">
              <span className="truncate max-w-[120px] sm:max-w-none">{homeName}</span>
              <span className="inline-flex items-center justify-center w-5 h-5 sm:w-8 sm:h-8 rounded-full bg-red-600 text-white text-[9px] sm:text-xs font-black shadow-md mx-0.5 shrink-0">
                VS
              </span>
              <span className="truncate max-w-[120px] sm:max-w-none">{awayName}</span>
            </h2>

            {/* Kickoff date & Stadium info */}
            <p className="mt-2 sm:mt-3 text-[10px] sm:text-[12px] text-slate-300 font-semibold tracking-wide flex items-center justify-center gap-1.5 flex-wrap">
              <span>{dateStr}</span>
              <span>·</span>
              <span>{timeStr}</span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">Live at {venue}</span>
            </p>
          </div>

          {/* Away Team Badge / Visual (Right) */}
          <div className="col-span-3 sm:col-span-3 flex items-center justify-center sm:justify-end">
            <div className="relative group-hover:scale-110 transition-transform duration-300">
              {awayBadge && !awayImgError ? (
                <img
                  src={awayBadge}
                  alt={awayName}
                  onError={() => setAwayImgError(true)}
                  className="w-12 h-12 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain rounded-2xl bg-white/10 p-1.5 sm:p-2 border border-white/20 backdrop-blur-md shadow-lg"
                />
              ) : (
                <div className="w-12 h-12 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white font-black text-sm sm:text-lg">
                  {awayName.slice(0, 3).toUpperCase()}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Bottom subtle indicator */}
        <div className="flex items-center justify-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] font-bold text-white transition-all backdrop-blur-md">
            <Play className="w-3 h-3 fill-white text-white" />
            <span>Watch Live Broadcast</span>
          </span>
        </div>

      </div>
    </Link>
  );
}
