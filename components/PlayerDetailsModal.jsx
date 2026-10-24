'use client';

import React, { useEffect } from 'react';
import { X, Trophy, DollarSign, Activity, Award, Shield, User, Footprints, Calendar, ArrowUpRight } from 'lucide-react';

export default function PlayerDetailsModal({ player, onClose }) {
  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!player) return null;

  const hasRedCard = (player.stats?.redCards > 0) || player.hasRedCard || player.isRedCard;
  const hasYellowCard = (player.stats?.yellowCards > 0) || player.hasYellowCard;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#121022] border border-white/15 shadow-2xl p-5 sm:p-6 text-white space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer z-10"
          title="Close details"
        >
          <X className="h-5 w-5" />
        </button>

        {/* ── 1. PLAYER HERO HEADER ── */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 pb-4 border-b border-white/10">
          {/* Avatar with Glow, Cards, and Club Badge Accent */}
          <div className="relative shrink-0">
            <div className={`h-20 w-20 sm:h-24 sm:w-24 rounded-full border-2 p-1 bg-gradient-to-tr shadow-xl ${
              hasRedCard 
                ? 'border-red-500 from-red-950/80 via-black to-red-900/40 shadow-red-900/50' 
                : 'border-purple-400/40 from-purple-900/60 via-indigo-900/40 to-black shadow-purple-900/30'
            }`}>
              {player.avatar ? (
                <img
                  src={player.avatar}
                  alt={player.name}
                  className="h-full w-full rounded-full object-cover object-top"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="h-full w-full rounded-full bg-gradient-to-tr from-purple-800 to-indigo-700 flex items-center justify-center text-xl font-black text-white">
                  {player.jersey}
                </div>
              )}
            </div>

            {/* Red Card / Yellow Card badge directly beside player avatar */}
            {hasRedCard ? (
              <span 
                className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded bg-red-600 border border-white text-white font-black text-[9px] shadow-lg animate-pulse z-10 flex items-center gap-1"
                title="Red Card (Sent Off)"
              >
                <span>🟥</span>
                <span>RED CARD</span>
              </span>
            ) : hasYellowCard ? (
              <span 
                className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded bg-amber-400 border border-black/40 text-black font-black text-[9px] shadow-md z-10 flex items-center gap-0.5"
                title="Yellow Card"
              >
                <span>🟨</span>
              </span>
            ) : null}

            {/* Club badge on avatar corner */}
            {player.teamBadge && (
              <img
                src={player.teamBadge}
                alt={player.teamName}
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-[#1b1930] p-0.5 border border-white/20 shadow-md object-contain"
              />
            )}
          </div>

          {/* Player Identifiers */}
          <div className="flex-1 text-center sm:text-left space-y-1.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-black">
                #{player.jersey}
              </span>
              <span className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                <span>{player.nationalityFlag}</span>
                <span>{player.nationality}</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                {player.position}
              </span>
              {hasRedCard && (
                <span className="px-2 py-0.5 rounded-md bg-red-500/20 border border-red-500/40 text-[11px] font-black text-red-400 uppercase tracking-wider animate-pulse flex items-center gap-1">
                  <span>🟥</span>
                  <span>Sent Off</span>
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
              {player.name}
            </h2>

            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-slate-400 font-medium">
              <span className="text-purple-300 font-semibold">{player.teamName}</span>
              <span>•</span>
              <span className="text-slate-300">{player.tacticalRole}</span>
            </div>
          </div>
        </div>

        {/* ── 2. MARKET VALUE & LIVE RATING HIGHLIGHTS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Market Value Card */}
          <div className="relative rounded-2xl bg-gradient-to-br from-amber-500/15 via-[#1b1930] to-[#121022] border border-amber-500/30 p-4 shadow-lg overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <DollarSign className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300/90">
                  Market Value
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-400">Transfermarkt</span>
            </div>

            <div className="my-2.5">
              <div className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 tracking-tight">
                {player.marketValue}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 font-medium">
                <span>Peak Value:</span>
                <span className="text-amber-300 font-bold">{player.highestMarketValue}</span>
              </p>
            </div>

            <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between text-[10px] text-slate-400">
              <span>Contract expires:</span>
              <span className="font-semibold text-slate-200">{player.contractUntil}</span>
            </div>
          </div>

          {/* Match Rating Card (Flashscore Official Formula & Scale) */}
          <div className="relative rounded-2xl bg-gradient-to-br from-[#1b1930] to-[#121022] border border-white/10 p-4 shadow-lg overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-slate-300">
                  <Activity className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                  Match Rating
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-400">Flashscore</span>
            </div>

            <div className="my-2.5 flex items-center gap-2.5">
              <div className={`px-2.5 py-1 rounded-lg text-xl sm:text-2xl font-black shadow-md ${player.ratingColor || 'bg-[#008744] text-white'}`}>
                {player.isRated === false ? '–' : (player.ratingFormatted || (typeof player.rating === 'number' ? player.rating.toFixed(1) : '6.0'))}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-white">
                  {player.isRated === false
                    ? 'Unrated'
                    : player.rating === 10.0
                    ? 'Exceptional 10.0'
                    : player.rating >= 8.0
                    ? 'Top Performer'
                    : player.rating >= 7.0
                    ? 'Good'
                    : player.rating >= 6.0
                    ? 'Average'
                    : 'Below Average'}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {player.isRated === false ? 'Requires ≥ 10 mins played' : 'Flashscore Scale / 10.0'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
              <span>Status:</span>
              <span className="font-semibold text-slate-200">{player.status} ({player.minutesPlayed}&apos;)</span>
            </div>
          </div>
        </div>

        {/* ── 3. MATCH STATS GRID ── */}
        <div className="rounded-2xl bg-[#17152a] border border-white/10 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5 text-purple-400" />
              Live Match Performance
            </h4>
            <span className="text-[10px] text-slate-400 font-medium">90 mins tracked</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
              <div className="text-base font-black text-white">{player.stats.goals}</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Goals</div>
            </div>

            <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
              <div className="text-base font-black text-white">{player.stats.assists}</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Assists</div>
            </div>

            <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
              <div className="text-base font-black text-emerald-400">{player.stats.passAccuracy}</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Passing Acc.</div>
            </div>

            <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
              <div className="text-base font-black text-white">{player.stats.keyPasses}</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Key Passes</div>
            </div>

            <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
              <div className="text-base font-black text-white">{player.stats.shots} ({player.stats.shotsOnTarget})</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Shots (Target)</div>
            </div>

            <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
              <div className="text-base font-black text-white">{player.stats.tackles}</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Tackles Won</div>
            </div>

            <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
              <div className="text-base font-black text-purple-300">{player.stats.duelsWon}</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Duels Won</div>
            </div>

            <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
              <div className="text-base font-black text-cyan-400">{player.stats.distanceCovered}</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Distance</div>
            </div>
          </div>
        </div>

        {/* ── 4. PHYSICAL & BIOGRAPHICAL DETAILS ── */}
        <div className="rounded-2xl bg-[#17152a] border border-white/10 p-4 space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-purple-400" />
            Player Profile & Bio
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Age & DOB</span>
              <p className="font-bold text-white">{player.age} yrs ({player.birthDate})</p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Height & Weight</span>
              <p className="font-bold text-white">{player.height}</p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Preferred Foot</span>
              <p className="font-bold text-white">{player.preferredFoot}</p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Weak Foot</span>
              <p className="font-bold text-amber-400">{'★'.repeat(player.weakFootStars)}{'☆'.repeat(5 - player.weakFootStars)}</p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Skill Moves</span>
              <p className="font-bold text-amber-400">{'★'.repeat(player.skillMovesStars)}{'☆'.repeat(5 - player.skillMovesStars)}</p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Nationality</span>
              <p className="font-bold text-white flex items-center gap-1">
                <span>{player.nationalityFlag}</span>
                <span>{player.nationality}</span>
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-300 pt-2 border-t border-white/5 leading-relaxed font-normal">
            {player.bio}
          </p>
        </div>
      </div>
    </div>
  );
}
