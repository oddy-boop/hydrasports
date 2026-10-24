'use client';

import { useState } from 'react';
import { BarChart3, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';

export default function MatchStatsSection({ teamStats, commentary, homeTeam, awayTeam, sport = 'football' }) {
  const [showStats, setShowStats] = useState(true);
  const [showCommentary, setShowCommentary] = useState(false);

  if (!teamStats.length && !commentary.length) return null;

  return (
    <div className="space-y-5 text-white">
      {/* Match Statistics panel */}
      {teamStats.length > 0 && (
        <div className="rounded-[24px] border border-white/10 bg-[#181627] overflow-hidden shadow-2xl">
          <button
            onClick={() => setShowStats(!showStats)}
            className="w-full flex items-center justify-between px-6 py-4 text-sm font-black text-white hover:text-purple-400 transition-colors border-b border-white/10 cursor-pointer"
          >
            <span className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-400">
                <BarChart3 className="h-4 w-4" />
              </div>
              <span>Match Statistics</span>
            </span>
            {showStats ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </button>
          
          {showStats && (
            <div className="px-6 py-6 space-y-5">
              {/* Teams Header row */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  {homeTeam?.badge && (
                    <img src={homeTeam.badge} alt="" className="h-6 w-6 rounded-full object-contain bg-white ring-1 ring-white/10" />
                  )}
                  <span className="text-xs font-black uppercase tracking-wider text-white">{homeTeam?.name || 'Home'}</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {sport === 'football' ? 'Team Statistics' : `${sport} statistics`}
                </span>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-black uppercase tracking-wider text-white">{awayTeam?.name || 'Away'}</span>
                  {awayTeam?.badge && (
                    <img src={awayTeam.badge} alt="" className="h-6 w-6 rounded-full object-contain bg-white ring-1 ring-white/10" />
                  )}
                </div>
              </div>

              {/* Stats Rows */}
              {teamStats[0]?.statistics?.map((stat, idx) => {
                const homeVal = teamStats[0]?.statistics?.[idx]?.displayValue || '-';
                const awayVal = teamStats[1]?.statistics?.[idx]?.displayValue || '-';
                const homePct = teamStats[0]?.statistics?.[idx]?.percentage || 50;
                const awayPct = teamStats[1]?.statistics?.[idx]?.percentage || 50;
                
                const homeNum = parseFloat(homeVal) || 0;
                const awayNum = parseFloat(awayVal) || 0;
                const homeLeads = homeNum > awayNum;
                const awayLeads = awayNum > homeNum;

                return (
                  <div key={`${stat.name || 'stat'}-${idx}`} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-black tabular-nums min-w-[3ch] text-left ${homeLeads ? 'text-purple-400' : 'text-slate-300'}`}>
                        {homeVal}
                      </span>
                      <span className="text-slate-400 text-[11px] font-black uppercase tracking-wider">
                        {stat.label || stat.name}
                      </span>
                      <span className={`font-black tabular-nums min-w-[3ch] text-right ${awayLeads ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {awayVal}
                      </span>
                    </div>
                    {/* Visual bar split */}
                    <div className="flex h-2.5 rounded-full overflow-hidden bg-[#131120] border border-white/10 gap-0.5">
                      <div
                        className={`rounded-l-full transition-all duration-700 ease-out ${
                          homeLeads 
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-500' 
                            : 'bg-purple-500/40'
                        }`}
                        style={{ width: `${homePct}%` }}
                      />
                      <div
                        className={`rounded-r-full transition-all duration-700 ease-out ml-auto ${
                          awayLeads 
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                            : 'bg-emerald-500/40'
                        }`}
                        style={{ width: `${awayPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 pt-3 border-t border-white/10">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{homeTeam?.name || 'Home'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{awayTeam?.name || 'Away'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Commentary log panel */}
      {commentary.length > 0 && (
        <div className="rounded-[24px] border border-white/10 bg-[#181627] overflow-hidden shadow-2xl">
          <button
            onClick={() => setShowCommentary(!showCommentary)}
            className="w-full flex items-center justify-between px-6 py-4 text-sm font-black text-white hover:text-purple-400 transition-colors border-b border-white/10 cursor-pointer"
          >
            <span className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-400">
                <MessageSquare className="h-4 w-4" />
              </div>
              <span>Live Commentary Log</span>
              <span className="text-[10px] font-black text-purple-300 bg-purple-600/30 border border-purple-500/30 px-2 py-0.5 rounded-full">
                {commentary.length}
              </span>
            </span>
            {showCommentary ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </button>
          
          {showCommentary && (
            <div className="px-5 py-4 space-y-0 max-h-80 overflow-y-auto divide-y divide-white/10">
              {commentary.slice(0, 30).map((item, idx) => {
                const eventType = (item.type || '').toLowerCase();
                const isGoal = eventType.includes('goal');
                const isCard = eventType.includes('card') || eventType.includes('yellow') || eventType.includes('red');
                const isSub = eventType.includes('sub');

                let timeBg = 'bg-white/5 border-white/10 text-slate-300';
                if (isGoal) timeBg = 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-black';
                else if (isCard) timeBg = 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-bold';
                else if (isSub) timeBg = 'bg-sky-500/20 border-sky-500/40 text-sky-300 font-bold';

                return (
                  <div key={idx} className="flex gap-4 text-xs py-3.5 items-start">
                    {/* Time badge */}
                    <span className={`shrink-0 font-mono font-bold w-14 text-center border px-2 py-0.5 rounded-md text-[11px] ${timeBg}`}>
                      {item.minute || item.time?.displayValue || 'KO'}
                    </span>
                    
                    {/* Log description */}
                    <div className="space-y-1 flex-1">
                      <p className={`font-semibold leading-relaxed ${isGoal ? 'text-emerald-300 font-bold' : 'text-slate-200'}`}>
                        {isGoal && '⚽ '}{isCard && '🟨 '}{isSub && '🔄 '}{item.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
