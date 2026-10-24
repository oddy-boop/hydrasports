'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Play, Clock, Star, MapPin } from 'lucide-react';
import { isTeamFavorited, toggleFavoriteTeam } from '@/lib/utils/favorites';
import { cleanTeamBadgeUrl, getTeamLeague } from '@/lib/utils/teamLogos';

function CircularTeamBadge({ team, size = 'w-12 h-12 sm:w-14 sm:h-14' }) {
  const [imgError, setImgError] = useState(false);
  const badgeSrc = cleanTeamBadgeUrl(team?.badge, team?.name || '');
  const hasBadge = badgeSrc && !imgError;
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(team?.name || 'T')}&background=ffffff&color=1e1b4b&size=128&bold=true&format=png`;

  return (
    <div className={`${size} rounded-2xl bg-white/10 backdrop-blur-md p-1.5 flex items-center justify-center shadow-md ring-1 ring-white/15 group-hover:scale-105 transition-transform duration-300 shrink-0 overflow-hidden`}>
      <img
        src={hasBadge ? badgeSrc : fallbackUrl}
        alt={team?.name || 'Team'}
        className="max-h-full max-w-full object-contain drop-shadow"
        loading="lazy"
        onError={() => setImgError(true)}
      />
    </div>
  );
}

export default function MatchCard({ match, tab }) {
  const {
    id,
    status,
    timestamp,
    homeTeam,
    awayTeam,
    tournament,
    venue,
    homeScore,
    awayScore,
  } = match;

  const isKickoffInFuture = Boolean(timestamp && timestamp > Date.now());
  const effectiveStatus = isKickoffInFuture ? 'upcoming' : status;

  const [liveData, setLiveData] = useState(null);
  const [homeFav, setHomeFav] = useState(false);
  const [awayFav, setAwayFav] = useState(false);
  const [countdownText, setCountdownText] = useState('');
  const [hasStarted, setHasStarted] = useState(() => !isKickoffInFuture);
  const polling = useRef(null);

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const diff = (timestamp || now) - now;
      if (diff <= 0) {
        setHasStarted(true);
        setCountdownText('');
        return;
      }
      setHasStarted(false);
      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(totalSeconds / (3600 * 24));
      const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      if (days > 0) {
        setCountdownText(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setCountdownText(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setCountdownText(`${minutes}m ${seconds}s`);
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [timestamp]);

  useEffect(() => {
    const checkFavs = () => {
      setHomeFav(isTeamFavorited(homeTeam?.name));
      setAwayFav(isTeamFavorited(awayTeam?.name));
    };
    checkFavs();
    window.addEventListener('favorites-updated', checkFavs);
    return () => {
      window.removeEventListener('favorites-updated', checkFavs);
    };
  }, [homeTeam?.name, awayTeam?.name]);

  useEffect(() => {
    if (status !== 'live') { setLiveData(null); return; }
    const poll = async () => {
      try {
        const res = await fetch(`/api/match/${id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.match) setLiveData(data.match);
      } catch {}
    };
    poll();
    polling.current = setInterval(poll, 15000);
    return () => { if (polling.current) clearInterval(polling.current); polling.current = null; };
  }, [id, status]);

  const liveMinute = liveData?.currentMinute || match.currentMinute;
  const liveMinuteNumber = liveData?.currentMinuteNumber ?? match.currentMinuteNumber;
  const displayHomeScore = liveData?.homeScore ?? homeScore;
  const displayAwayScore = liveData?.awayScore ?? awayScore;

  const currentMinute = liveMinute || (liveMinuteNumber ? `${liveMinuteNumber}'` : '');

  const dateStr = new Date(timestamp || Date.now()).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const timeStr = new Date(timestamp || Date.now()).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const rawTourn = (tournament || '').trim();
  const displayTournament = (
    !rawTourn || 
    rawTourn.toLowerCase() === 'football' || 
    rawTourn.toLowerCase() === 'match broadcast'
  )
    ? (getTeamLeague(homeTeam?.name) || getTeamLeague(awayTeam?.name) || 'League Match')
    : rawTourn;

  const venueName = venue || (
    displayTournament.toLowerCase() === 'league match'
      ? `${homeTeam?.name || 'Home'} Arena`
      : `${displayTournament} Arena`
  );

  return (
    <div className="group relative flex flex-col justify-between rounded-[22px] bg-[#1c1a2d] border border-white/[0.06] p-5 shadow-xl hover:border-purple-500/30 hover:shadow-[0_12px_32px_rgba(0,0,0,0.5)] transition-all duration-300">
      
      {/* ── CARD HEADER (Tournament/Date & Live Badge) ── */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h4 className="text-[13px] font-black text-white tracking-tight leading-snug">
            {displayTournament}
          </h4>
          <p className="text-[10.5px] font-medium text-slate-400 mt-0.5">
            {dateStr} · {timeStr}
          </p>
        </div>

        {/* Live / Status Pill from Image 1 */}
        <div>
          {effectiveStatus === 'live' && hasStarted ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/90 border border-red-500/40 text-[10.5px] font-black text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              <span>{currentMinute ? `${currentMinute} Live` : 'Live'}</span>
            </span>
          ) : effectiveStatus === 'finished' ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-800 border border-white/10 text-[10.5px] font-bold text-slate-300">
              FT
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-[10.5px] font-bold text-amber-300">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>{timeStr}</span>
            </span>
          )}
        </div>
      </div>

      {/* ── CENTER SCOREBOARD (Circular Badges & Big Tabular Score) ── */}
      <div className="py-2">
        <div className="flex items-center justify-between gap-4 px-2">
          
          {/* Home Team Badge */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <CircularTeamBadge team={homeTeam} />
            <span className="text-xs font-bold text-white text-center line-clamp-1 max-w-[110px]" title={homeTeam?.name}>
              {homeTeam?.name || 'Home'}
            </span>
          </div>

          {/* Big Center Score */}
          <div className="flex flex-col items-center justify-center shrink-0 min-w-[70px]">
            {hasStarted && (effectiveStatus === 'live' || effectiveStatus === 'finished') && (displayHomeScore != null && displayAwayScore != null) ? (
              <span className="text-2xl sm:text-3xl font-black text-white tracking-wider tabular-nums">
                {displayHomeScore ?? 0} : {displayAwayScore ?? 0}
              </span>
            ) : (
              <span className="text-xl sm:text-2xl font-black text-slate-400 tracking-wider">
                VS
              </span>
            )}
            
            {/* Small stadium subtitle */}
            <span className="text-[9.5px] text-slate-400 font-medium text-center truncate max-w-[120px] mt-1" title={venueName}>
              {venueName}
            </span>
          </div>

          {/* Away Team Badge */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <CircularTeamBadge team={awayTeam} />
            <span className="text-xs font-bold text-white text-center line-clamp-1 max-w-[110px]" title={awayTeam?.name}>
              {awayTeam?.name || 'Away'}
            </span>
          </div>

        </div>
      </div>

      {/* ── ACTION BUTTON: Watch Now vs Live Countdown (Image 1) ── */}
      <div className="mt-4 pt-3 border-t border-white/[0.06]">
        {!hasStarted && countdownText ? (
          <div
            className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-[#232039] border border-amber-500/30 text-amber-300 font-extrabold text-xs uppercase tracking-wider transition-all duration-200 shadow-inner"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Kickoff in {countdownText}</span>
          </div>
        ) : effectiveStatus === 'finished' ? (
          <Link
            href={`/watch/${id}?tab=${tab || 'finished'}`}
            className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-white/[0.06] hover:bg-white/10 text-slate-300 font-bold text-xs uppercase tracking-wider transition-all duration-200"
          >
            <span>Match Ended · View Details</span>
          </Link>
        ) : (
          <Link
            href={`/watch/${id}?tab=${tab || 'live'}`}
            className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-[#10b981] hover:bg-[#059669] active:scale-[0.98] text-white font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-[0_4px_16px_rgba(16,185,129,0.3)] cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white text-white" />
            <span>Watch Now</span>
          </Link>
        )}
      </div>

    </div>
  );
}
