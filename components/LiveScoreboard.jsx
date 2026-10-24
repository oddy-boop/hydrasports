'use client';

import { useState, useEffect, useCallback } from 'react';
import LiveMinute from './LiveMinute';

export default function LiveScoreboard({ matchId, initial, isFinal = false, sport = 'football' }) {
  const [data, setData] = useState(initial);
  const [homeBadgeError, setHomeBadgeError] = useState(false);
  const [awayBadgeError, setAwayBadgeError] = useState(false);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/match/${matchId}`, { cache: 'no-store' });
      const json = await res.json();
      if (json.match) setData(json.match);
    } catch (e) {
      // Silent catch
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    if (data.status !== 'live') return;
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [data.status, refresh]);

  return (
    <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-[#181627] backdrop-blur-xl px-6 py-6 shadow-2xl text-white transition-all duration-300">
      {/* Stadium subtle field ambiance */}
      <div className="absolute top-0 right-1/4 w-[280px] h-[280px] bg-purple-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[280px] h-[280px] bg-indigo-500/10 blur-3xl pointer-events-none" />

      {/* Top Header: Tournament & Live Pulse */}
      <div className="relative z-10 flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          {data.leagueLogo && (
            <img src={data.leagueLogo} alt="" className="h-4.5 w-4.5 rounded-full object-contain" />
          )}
          <span className="text-xs font-black uppercase tracking-wider text-slate-300">
            {data.tournament || 'Football Competition'}
          </span>
        </div>

        <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
          isFinal
            ? 'bg-white/5 text-slate-300 border-white/10'
            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isFinal ? 'bg-slate-400' : 'bg-emerald-400 animate-ping'}`} />
          <span>{isFinal ? 'FINAL SCORE' : 'LIVE BROADCAST'}</span>
        </div>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 my-4">
        {/* Home Team */}
        <div className="flex flex-col items-center gap-2 min-w-0 flex-1 md:items-end">
          <div className="flex flex-col items-center md:items-end gap-2">
            {data.homeBadge && !homeBadgeError ? (
              <img
                src={data.homeBadge}
                alt=""
                className="h-16 w-16 rounded-xl object-contain bg-white p-2 ring-2 ring-white/10 shadow-md"
                onError={() => setHomeBadgeError(true)}
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#131120] border border-white/10 px-2 text-center text-slate-200 text-xl font-black leading-none">
                {data.homeName?.substring(0, 2).toUpperCase()}
              </div>
            )}
            <span className="text-base font-black text-white text-center md:text-right truncate max-w-[200px]">
              {data.homeName}
            </span>
          </div>
        </div>

        {/* Score Center Board */}
        <div className="flex items-center gap-6 shrink-0 bg-[#131120] border border-white/10 rounded-2xl px-6 py-3.5 shadow-xl">
          <span className="text-4xl sm:text-5xl font-black tabular-nums text-white tracking-tight">
            {data.homeScore ?? '—'}
          </span>

          <div className="flex flex-col items-center">
            <span className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest mb-1">
              {isFinal ? 'Final' : sport === 'football' ? 'Match Minute' : 'Game Status'}
            </span>
            {isFinal ? (
              <span className="text-sm font-black uppercase tracking-widest text-slate-300">FT</span>
              ) : sport === 'football' ? (
              <LiveMinute apiMinute={data.currentMinute} apiMinuteNumber={data.currentMinuteNumber} />
              ) : (
                <span className="max-w-[120px] text-center text-xs font-black uppercase tracking-wide text-slate-300">
                  {data.currentMinute || 'LIVE'}
                </span>
              )}
          </div>

          <span className="text-4xl sm:text-5xl font-black tabular-nums text-white tracking-tight">
            {data.awayScore ?? '—'}
          </span>
        </div>

        {/* Away Team */}
        <div className="flex flex-col items-center gap-2 min-w-0 flex-1 md:items-start">
          <div className="flex flex-col items-center md:items-start gap-2">
            {data.awayBadge && !awayBadgeError ? (
              <img
                src={data.awayBadge}
                alt=""
                className="h-16 w-16 rounded-xl object-contain bg-white p-2 ring-2 ring-white/10 shadow-md"
                onError={() => setAwayBadgeError(true)}
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#131120] border border-white/10 px-2 text-center text-slate-200 text-xl font-black leading-none">
                {data.awayName?.substring(0, 2).toUpperCase()}
              </div>
            )}
            <span className="text-base font-black text-white text-center md:text-left truncate max-w-[200px]">
              {data.awayName}
            </span>
          </div>
        </div>
      </div>

      {/* Info footer */}
      <div className="relative z-10 mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs font-bold text-slate-400 border-t border-white/10 pt-3">
        <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-slate-300">
          {data.dateStr} &middot; {data.timeStr}
        </span>
        {data.venue && data.venue !== 'N/A' && (
          <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-slate-300">
            🏟️ {data.venue}
          </span>
        )}
      </div>
    </div>
  );
}
