'use client';

import React from 'react';
import Link from 'next/link';
import { Radio, Layers, Activity, ChevronRight, Zap } from 'lucide-react';

export default function HydraSportsActivityRail() {
  const events = [
    {
      time: "64'",
      title: 'Goal! Marseille 2 - 1',
      detail: 'Aubameyang strike into top corner',
      icon: '⚽',
      badge: 'bg-emerald-100 text-emerald-800',
    },
    {
      time: "58'",
      title: 'Yellow Card Issued',
      detail: 'Tactical foul in midfield',
      icon: '🟨',
      badge: 'bg-amber-100 text-amber-800',
    },
    {
      time: "45'",
      title: 'Halftime Interval',
      detail: 'Teams in dressing room',
      icon: '⏱',
      badge: 'bg-slate-100 text-slate-700',
    },
    {
      time: 'Live',
      title: 'Stream Engine Online',
      detail: 'HLS CDN latency: 0.8s verified',
      icon: '⚡',
      badge: 'bg-teal-100 text-teal-800',
    },
  ];

  return (
    <aside className="w-[210px] xl:w-[230px] shrink-0 border-l border-slate-200/80 p-5 pb-36 xl:p-6 xl:pb-36 hidden lg:flex flex-col justify-between bg-white lg:sticky lg:top-0 lg:h-screen lg:max-h-screen lg:self-start overflow-y-auto">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <h3 className="text-[13px] font-black text-slate-900 tracking-tight">
              Live Match Centre
            </h3>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {/* Live Sports Timeline */}
        <div className="space-y-3.5">
          {events.map((event, idx) => (
            <div key={idx} className="flex items-start gap-2.5 p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
              <span className="text-base leading-none select-none mt-0.5">
                {event.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-[11px] font-extrabold text-slate-900 truncate leading-tight">
                    {event.title}
                  </h4>
                  <span className={`text-[8.5px] font-black px-1.5 py-0.2 rounded-full ${event.badge}`}>
                    {event.time}
                  </span>
                </div>
                <p className="text-[9.5px] text-slate-500 truncate mt-0.5 font-medium">
                  {event.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Promo Box: Multi-View Arena */}
      <div className="relative rounded-[22px] overflow-hidden p-5 text-white shadow-md mt-6 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 border border-emerald-500/30">
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <span className="inline-flex items-center gap-1 text-[9px] font-black tracking-wider uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 mb-2">
              <Zap className="w-2.5 h-2.5" />
              <span>Multi-Stream</span>
            </span>
            <h4 className="text-sm font-black text-white leading-tight">
              Watch 4 Games<br />Simultaneously
            </h4>
          </div>
          <Layers className="w-5 h-5 text-emerald-400 shrink-0" />
        </div>

        {/* Action button */}
        <div className="relative z-10 mt-4">
          <Link
            href="/multistream"
            className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10.5px] font-black shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all text-center"
          >
            <span>Launch Multi-View</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
