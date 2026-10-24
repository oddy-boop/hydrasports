'use client';

import React from 'react';
import Link from 'next/link';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Radio,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { useHydraSports } from './HydraContext';

export default function FootyNowBar() {
  const {
    activeMatch,
    toggleStream,
    isMuted,
    setIsMuted,
  } = useHydraSports();

  const isLive = activeMatch?.status === 'live';

  if (!activeMatch || activeMatch.status === 'finished') return null;

  const handleStreamToggle = () => {
    window.dispatchEvent(new CustomEvent('hydra-stream-toggle'));
    toggleStream();
  };

  const handleMuteToggle = () => {
    const nextMuted = !isMuted;
    window.dispatchEvent(new CustomEvent('hydra-stream-mute', {
      detail: { muted: nextMuted },
    }));
    setIsMuted(nextMuted);
  };

  return (
    <div className="now-dock fixed z-40 bottom-3 md:bottom-5">
      <div className="now-dock-inner min-h-[82px] px-3 py-3 md:px-5 rounded-[24px] bg-[#1a182d]/95 backdrop-blur-2xl border border-white/10 shadow-[0_18px_55px_rgba(0,0,0,0.6)] flex items-center justify-between gap-3 md:gap-5 transition-all duration-300">
        {/* Left Section: Active Match & Score */}
        <div className="flex items-center gap-3 min-w-0 max-w-[245px] md:max-w-[330px] shrink-0">
          <div className="now-dock-icon w-11 h-11 rounded-2xl flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={isLive ? 'now-dock-live' : 'now-dock-status'}>
                {isLive ? 'LIVE' : 'UPCOMING'}
              </span>
              <h4 className="text-xs md:text-[13px] font-black text-white truncate leading-tight">
                {activeMatch?.title || 'Live Match Centre'}
              </h4>
            </div>
            <p className="text-[10px] md:text-[11px] text-slate-400 truncate mt-1 font-bold flex items-center gap-1">
              <span>{activeMatch?.tournament || 'Football Live'}</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-black tabular-nums">
                {isLive ? `${activeMatch?.homeScore ?? '—'} - ${activeMatch?.awayScore ?? '—'} · ${activeMatch?.currentMinute || 'LIVE'}` : 'Upcoming'}
              </span>
            </p>
          </div>
        </div>

        {/* Center Section: Stream Controls & Status */}
        <div className="now-dock-center flex items-center justify-center">
          <div className="now-dock-play-wrap">
            {/* Play/Pause Stream button */}
            <button
              onClick={handleStreamToggle}
              className="now-dock-play w-11 h-11 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title={activeMatch?.isStreaming ? 'Pause Stream' : 'Resume Stream'}
            >
              {activeMatch?.isStreaming ? (
                <Pause className="w-4 h-4 fill-white text-white" />
              ) : (
                <Play className="w-4 h-4 ml-0.5 fill-white text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Right Section: Volume & Watch actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Volume toggle */}
          <button
            onClick={handleMuteToggle}
            className="now-dock-icon-button cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>

          {/* Watch Full Match Button */}
          <Link
            href={`/watch/${activeMatch?.id || 'troyes-vs-marseille-2489514'}`}
            className="now-dock-watch flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[11px] font-black shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
          >
            <span className="hidden sm:inline">Open match</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
