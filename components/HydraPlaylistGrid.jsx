'use client';

import React from 'react';
import Link from 'next/link';
import { Play, Radio, Flame, Shield } from 'lucide-react';
import { useHydraSports } from './HydraContext';
import { cleanTeamBadgeUrl } from '@/lib/utils/teamLogos';

function TeamBadge({ team, name }) {
  const [err, setErr] = React.useState(false);
  const badgeSrc = cleanTeamBadgeUrl(team?.badge, name || team?.name || '');
  if (badgeSrc && !err) {
    return (
      <img
        src={badgeSrc}
        alt={name || team?.name}
        onError={() => setErr(true)}
        className="w-8 h-8 rounded-lg object-contain bg-white/10 p-1 ring-1 ring-white/15 shadow-xs"
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-200 text-emerald-800 text-[10px] font-black flex items-center justify-center shrink-0 border border-emerald-300 leading-none">
      {(name || team?.name || 'T').substring(0, 2).toUpperCase()}
    </div>
  );
}

export default function FootyFeaturedFixtures({ matches = [], onSeeAll }) {
  const { playMatch, activeMatch } = useHydraSports();

  // Pick 4 top matches from the live matches or fixtures
  const topMatches = (matches.length > 0 ? matches : [
    {
      id: 'troyes-vs-marseille-2489514',
      title: 'Troyes vs Marseille',
      tournament: 'Ligue 1',
      status: 'live',
      homeTeam: { name: 'Troyes' },
      awayTeam: { name: 'Marseille' },
      homeScore: 1,
      awayScore: 2,
      currentMinute: '67',
      sources: [1, 2, 3, 4],
    },
    {
      id: 'real-madrid-vs-sevilla',
      title: 'Real Madrid vs Sevilla',
      tournament: 'La Liga',
      status: 'live',
      homeTeam: { name: 'Real Madrid' },
      awayTeam: { name: 'Sevilla' },
      homeScore: 3,
      awayScore: 1,
      currentMinute: '82',
      sources: [1, 2, 3],
    },
    {
      id: 'arsenal-vs-chelsea',
      title: 'Arsenal vs Chelsea',
      tournament: 'Premier League',
      status: 'live',
      homeTeam: { name: 'Arsenal' },
      awayTeam: { name: 'Chelsea' },
      homeScore: 2,
      awayScore: 0,
      currentMinute: '54',
      sources: [1, 2, 3, 4, 5],
    },
    {
      id: 'inter-vs-juventus',
      title: 'Inter vs Juventus',
      tournament: 'Serie A',
      status: 'live',
      homeTeam: { name: 'Inter Milan' },
      awayTeam: { name: 'Juventus' },
      homeScore: 1,
      awayScore: 1,
      currentMinute: '71',
      sources: [1, 2],
    },
  ]).slice(0, 4);

  return (
    <section className="mt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-emerald-600" />
          <h3 className="text-lg font-black text-slate-900 tracking-tight">
            Trending Fixtures
          </h3>
        </div>
        <button
          onClick={onSeeAll}
          className="text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors"
        >
          See All Matches
        </button>
      </div>

      {/* Grid of 4 Match Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {topMatches.map((match) => {
          const isLive = match.status === 'live';
          const isSelected = activeMatch?.id === match.id;

          return (
            <Link
              key={match.id}
              href={`/watch/${match.id}`}
              onClick={() => playMatch(match)}
              className="group relative rounded-[22px] overflow-hidden p-4 bg-gradient-to-b from-white via-slate-50/80 to-slate-100/60 border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
            >
              {/* Card Header: Tournament & Live indicator */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 truncate max-w-[120px]">
                  {match.tournament || 'Football League'}
                </span>

                {isLive ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100/90 text-emerald-800 text-[9.5px] font-black border border-emerald-300/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    <span>{match.currentMinute ? `${match.currentMinute}'` : 'LIVE'}</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                    {new Date(match.timestamp || Date.now()).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>

              {/* Clubs comparison */}
              <div className="space-y-2 py-2">
                {/* Home team */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <TeamBadge team={match.homeTeam} name={match.homeTeam?.name} />
                    <span className="text-xs font-bold text-slate-800 truncate">
                      {match.homeTeam?.name || 'Home'}
                    </span>
                  </div>
                  {isLive && match.homeScore !== null && (
                    <span className="text-sm font-black text-slate-900 tabular-nums">
                      {match.homeScore}
                    </span>
                  )}
                </div>

                {/* Away team */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <TeamBadge team={match.awayTeam} name={match.awayTeam?.name} />
                    <span className="text-xs font-bold text-slate-800 truncate">
                      {match.awayTeam?.name || 'Away'}
                    </span>
                  </div>
                  {isLive && match.awayScore !== null && (
                    <span className="text-sm font-black text-slate-900 tabular-nums">
                      {match.awayScore}
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Frosted Overlay Badge with Play button */}
              <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between">
                <span className="text-[9.5px] font-bold text-slate-500">
                  {match.sources?.length || 3} HD Feeds Online
                </span>

                <div className="w-7 h-7 rounded-full bg-emerald-600 group-hover:bg-emerald-700 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Play className="w-3 h-3 fill-white text-white ml-0.5" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
