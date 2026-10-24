'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function MatchCountdown({ timestamp, status }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    function update() {
      const diff = timestamp - Date.now();
      if (diff <= 0) {
        setTimeLeft({
          label: status === 'upcoming' ? 'Streaming not started' : 'Ended',
          isEnded: status !== 'upcoming',
          isNotStarted: status === 'upcoming',
          isSoon: false,
        });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft({ days, hours, minutes, seconds, isEnded: false, isNotStarted: false, isSoon: false });
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [timestamp]);

  if (!timeLeft || status === 'live') return null;

  if (timeLeft.isSoon) {
    return (
      <div className="rounded-[22px] border border-emerald-500/30 bg-emerald-500/10 px-6 py-4 shadow-xl text-center text-white">
        <span className="text-sm font-black text-emerald-400 animate-pulse">📢 Match Kickoff: Starting Very Soon</span>
      </div>
    );
  }

  if (timeLeft.isEnded) {
    return (
      <div className="rounded-[22px] border border-white/10 bg-[#181627] px-6 py-4 shadow-xl text-center text-white">
        <span className="text-sm font-black text-slate-400">Match ended</span>
      </div>
    );
  }

  if (timeLeft.isNotStarted) {
    return (
      <div className="rounded-[28px] border border-amber-500/30 bg-amber-500/10 px-6 py-8 text-center shadow-xl text-white">
        <span className="text-xl font-black uppercase tracking-wide text-amber-300 sm:text-2xl">
          Streaming not started
        </span>
        <p className="mt-2 text-sm font-medium text-amber-200/80">
          The scheduled kickoff time has arrived, but no stream is available yet.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border border-white/10 bg-[#181627] px-5 py-7 shadow-2xl sm:px-8 sm:py-9 text-white">
      <div className="flex flex-col items-center gap-7">
        <div className="flex items-center gap-3">
          <Clock className="h-7 w-7 text-purple-400" />
          <span className="text-lg font-black uppercase tracking-wide text-white sm:text-2xl">Match Kickoff Countdown</span>
        </div>

        <div className="flex w-full items-center justify-center gap-1.5 sm:gap-4">
          {timeLeft.days > 0 && (
            <div className="flex items-center">
              <div className="rounded-xl border border-white/10 bg-[#131120] px-3 py-2.5 text-3xl font-black tabular-nums text-white shadow-md sm:px-5 sm:py-4 sm:text-5xl">
                {timeLeft.days}
              </div>
              <span className="ml-1 mr-1 text-xs font-black uppercase text-slate-400 sm:ml-2 sm:mr-2 sm:text-sm">d</span>
            </div>
          )}
          
          <div className="flex items-center">
            <div className="rounded-xl border border-white/10 bg-[#131120] px-3 py-2.5 text-3xl font-black tabular-nums text-white shadow-md sm:px-5 sm:py-4 sm:text-5xl">
              {String(timeLeft.hours).padStart(2, '0')}
            </div>
            <span className="ml-1 mr-1 text-xs font-black uppercase text-slate-400 sm:ml-2 sm:mr-2 sm:text-sm">h</span>
          </div>

          <div className="flex items-center">
            <div className="rounded-xl border border-white/10 bg-[#131120] px-3 py-2.5 text-3xl font-black tabular-nums text-white shadow-md sm:px-5 sm:py-4 sm:text-5xl">
              {String(timeLeft.minutes).padStart(2, '0')}
            </div>
            <span className="ml-1 mr-1 text-xs font-black uppercase text-slate-400 sm:ml-2 sm:mr-2 sm:text-sm">m</span>
          </div>

          <div className="flex items-center">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-3 py-2.5 text-3xl font-black tabular-nums text-emerald-400 shadow-md sm:px-5 sm:py-4 sm:text-5xl">
              {String(timeLeft.seconds).padStart(2, '0')}
            </div>
            <span className="ml-1 text-xs font-black uppercase text-emerald-400 sm:text-sm">s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
