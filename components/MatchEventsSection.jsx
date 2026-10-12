'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Flag } from 'lucide-react';

function eventIcon(type) {
  const value = type.toLowerCase();
  if (value.includes('substitution')) return '🔄';
  if (value.includes('red')) return '🟥';
  if (value.includes('yellow')) return '🟨';
  if (value.includes('goal') || value.includes('penalty')) return '⚽';
  return '•';
}

export default function MatchEventsSection({ events }) {
  const [open, setOpen] = useState(true);
  if (!events?.length) return null;

  return (
    <section className="match-events-card rounded-[16px] border border-slate-200/90 bg-white/95 overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between border-b border-slate-100 px-3 py-2 text-xs font-black text-slate-800 hover:text-emerald-700 transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md border border-amber-200 bg-amber-50">
            <Flag className="h-3.5 w-3.5 text-amber-600" />
          </span>
          <span>Match Events & Timeline</span>
          <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
            {events.length}
          </span>
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>

      {open && (
        <div className="match-events-list divide-y divide-slate-100 px-3 py-0.5">
          {events.map((event, index) => (
            <div key={`${event.minute}-${event.type}-${index}`} className="flex gap-1.5 py-1 text-[10px] items-center">
              <span className="w-11 shrink-0 rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-center font-mono text-[10px] font-black text-emerald-800">
                {event.minute || '—'}
              </span>
              <span className="text-sm leading-none select-none">{eventIcon(event.type)}</span>
              <div className="min-w-0 flex-1">
                <p className="font-black text-[11px] text-slate-900">{event.type}</p>
                <div className="space-y-0 text-[10px] text-slate-600 font-medium">
                  {event.participants?.filter(player => player.name).map((player, playerIndex) => (
                    <p key={`${player.name}-${playerIndex}`}>
                      <span className="mr-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        {player.role === 'scorer' ? 'Scorer' : player.role === 'assist' ? 'Assist' : player.role === 'in' ? 'In' : player.role === 'out' ? 'Out' : 'Player'}
                      </span>
                      {player.name}
                    </p>
                  ))}
                  {!event.participants?.some(player => player.name) && <p>{event.text}</p>}
                </div>
                {event.team && <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">{event.team}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
