'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Play, Radio, Calendar, Trophy, ChevronRight, Star, Layers, Check } from 'lucide-react';
import { useHydraSports } from './HydraContext';
import { matchBelongsToLeague, COMPETITIONS_LIST, POPULAR_TEAMS } from './leagueMatcher';

function TeamBadge({ team, name }) {
  const [err, setErr] = useState(false);
  if (team?.badge && !err) {
    return (
      <img
        src={team.badge}
        alt={name || team?.name}
        onError={() => setErr(true)}
        className="w-7 h-7 rounded-lg object-contain bg-white p-1 ring-1 ring-slate-200"
      />
    );
  }
  return (
    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-200 text-emerald-800 text-[10px] font-black flex items-center justify-center shrink-0 border border-emerald-300 leading-none">
      {(name || team?.name || 'T').substring(0, 2).toUpperCase()}
    </div>
  );
}

export default function HydraSportsSection({ matches = [], teamFilter = '' }) {
  const {
    searchQuery,
    selectedLeague,
    selectLeague,
    activeMenu,
    selectMenu,
    playMatch,
    favouriteTeams,
    toggleFavourite,
    menuTrigger,
  } = useHydraSports();

  const [filterTab, setFilterTab] = useState('all');
  const [sortBy, setSortBy] = useState('priority');
  const sectionRef = useRef(null);

  // Sync tab with activeMenu from sidebar
  useEffect(() => {
    if (activeMenu === 'live') {
      setFilterTab('live');
    } else if (activeMenu === 'schedule') {
      setFilterTab('upcoming');
    } else if (activeMenu === 'results') {
      setFilterTab('finished');
    } else if (activeMenu === 'explore' || activeMenu === 'competitions' || activeMenu === 'favourites') {
      setFilterTab('all');
    }
  }, [activeMenu]);

  // Smooth scroll to fixtures when user clicks a sidebar button
  useEffect(() => {
    if (menuTrigger > 0 && sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [menuTrigger]);

  const filteredMatches = useMemo(() => {
    let list = matches || [];

    if (teamFilter) {
      const query = teamFilter.toLowerCase();
      list = list.filter((m) =>
        m.homeTeam?.name?.toLowerCase() === query ||
        m.awayTeam?.name?.toLowerCase() === query
      );
    }

    // 1. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.title?.toLowerCase().includes(q) ||
          m.homeTeam?.name?.toLowerCase().includes(q) ||
          m.awayTeam?.name?.toLowerCase().includes(q) ||
          m.tournament?.toLowerCase().includes(q)
      );
    }

    // 2. League filter using intelligent leagueMatcher
    if (selectedLeague && selectedLeague !== 'All') {
      list = list.filter((m) => matchBelongsToLeague(m, selectedLeague));
    }

    // 3. Favourites filter if user clicked "Favourite Teams"
    if (activeMenu === 'favourites') {
      if (favouriteTeams.length > 0) {
        list = list.filter((m) => {
          const home = m.homeTeam?.name || '';
          const away = m.awayTeam?.name || '';
          return (
            favouriteTeams.some((fav) => home.toLowerCase().includes(fav.toLowerCase())) ||
            favouriteTeams.some((fav) => away.toLowerCase().includes(fav.toLowerCase()))
          );
        });
      }
    }

    // 4. Tab filter (All, Live, Upcoming)
    if (!teamFilter && filterTab === 'live') {
      list = list.filter((m) => m.status === 'live');
    } else if (!teamFilter && filterTab === 'upcoming') {
      list = list.filter((m) => m.status === 'upcoming');
    } else if (!teamFilter && filterTab === 'finished') {
      list = list.filter((m) => m.status === 'finished');
    }

    return [...list].sort((a, b) => {
      if (sortBy === 'kickoff') return (a.timestamp || 0) - (b.timestamp || 0);
      if (sortBy === 'competition') {
        return (a.tournament || '').localeCompare(b.tournament || '') ||
          (a.timestamp || 0) - (b.timestamp || 0);
      }
      if (sortBy === 'sport') {
        return (a.sport || '').localeCompare(b.sport || '') ||
          (a.timestamp || 0) - (b.timestamp || 0);
      }

      const statusRank = { live: 0, upcoming: 1, finished: 2 };
      return (statusRank[a.status] ?? 3) - (statusRank[b.status] ?? 3) ||
        (a.timestamp || 0) - (b.timestamp || 0);
    });
  }, [matches, searchQuery, selectedLeague, filterTab, activeMenu, favouriteTeams, teamFilter, sortBy]);

  return (
    <section ref={sectionRef} className="mt-10 mb-8 scroll-mt-24">
      {/* Competitions Shelf (visible when Competitions is selected or user chooses) */}
      {activeMenu === 'competitions' && (
        <div className="mb-8 p-5 rounded-[24px] bg-gradient-to-br from-white via-slate-50 to-emerald-50/40 border border-emerald-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-emerald-600" />
              <h4 className="text-base font-black text-slate-900">
                Competitions & Leagues
              </h4>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Select a competition to filter live feeds
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {COMPETITIONS_LIST.map((comp) => {
              const isSelected = selectedLeague === comp.id;
              const count = (matches || []).filter((m) => matchBelongsToLeague(m, comp.id)).length;

              return (
                <button
                  key={comp.id}
                  type="button"
                  onClick={() => selectLeague(comp.id)}
                  className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.02]'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 hover:border-emerald-400/60 shadow-2xs'
                  }`}
                >
                  <div className="text-xl mb-1">{comp.flag}</div>
                  <div className="text-xs font-extrabold truncate">{comp.name}</div>
                  <div className={`text-[10px] mt-0.5 font-bold ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                    {count} {count === 1 ? 'match' : 'matches'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Favourite Teams Quick Selector (visible when Favourites is active) */}
      {activeMenu === 'favourites' && (
        <div className="mb-6 p-5 rounded-[24px] bg-white border border-amber-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <h4 className="text-sm font-black text-slate-900">
                Your Pinned Clubs ({favouriteTeams.length})
              </h4>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Click a club to toggle favourite status
            </span>
          </div>

          {/* Popular Teams quick-star pills */}
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_TEAMS.map((team) => {
              const isFav = favouriteTeams.some((t) => t.toLowerCase() === team.toLowerCase());
              return (
                <button
                  key={team}
                  type="button"
                  onClick={() => toggleFavourite(team)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isFav
                      ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200'
                  }`}
                >
                  <Star className={`w-3 h-3 ${isFav ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                  <span>{team}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              {activeMenu === 'live'
                ? 'Live Matches'
                : activeMenu === 'schedule'
                ? "Today's Kickoff Schedule"
                : activeMenu === 'results'
                ? 'Past Match Results'
                : activeMenu === 'favourites'
                ? 'Favourite Teams Matches'
                : selectedLeague !== 'All'
                ? `${selectedLeague} Fixtures`
                : 'Live & Upcoming Fixtures'}
            </h3>

            {selectedLeague !== 'All' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300">
                <span>{selectedLeague}</span>
                <button
                  type="button"
                  onClick={() => selectLeague('All')}
                  className="hover:text-emerald-950 font-black ml-0.5 cursor-pointer"
                  title="Clear filter"
                >
                  ×
                </button>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Live scores and streams aggregated across multiple sports
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600">
            <span>Sort</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="cursor-pointer bg-transparent font-black text-slate-800 outline-none"
              aria-label="Sort matches"
            >
              <option value="priority">Live priority</option>
              <option value="kickoff">Kickoff time</option>
              <option value="competition">Competition</option>
              <option value="sport">Sport</option>
            </select>
          </label>

          <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 p-1">
            {['all', 'live', 'upcoming', 'finished'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setFilterTab(t);
                  if (t === 'live') selectMenu('live');
                  else if (t === 'upcoming') selectMenu('schedule');
                  else if (t === 'finished') selectMenu('results');
                  else selectMenu('explore');
                }}
                className={`px-3 py-1 rounded-full text-[11px] font-extrabold capitalize transition-all cursor-pointer ${
                  filterTab === t
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t === 'all' ? 'All Matches' : t === 'finished' ? 'Past Results' : t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Match Stream Cards Grid */}
      {filteredMatches.length === 0 ? (
        <div className="p-8 text-center rounded-[24px] bg-white border border-slate-200">
          <p className="text-xs font-bold text-slate-500">
            {activeMenu === 'favourites'
              ? 'No scheduled matches found for your favourite teams. Add more teams above to track them!'
              : selectedLeague !== 'All'
              ? `No fixtures currently found for ${selectedLeague}. Click Reset to view all available matches.`
              : 'No fixtures found matching your criteria. Try clearing your search or switching filters.'}
          </p>
          {(selectedLeague !== 'All' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                selectLeague('All');
                selectMenu('explore');
              }}
              className="mt-3 px-4 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-xs hover:bg-emerald-700 transition-all cursor-pointer"
            >
              Show All Fixtures
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredMatches.map((match) => {
            const isLive = match.status === 'live';
            const timeStr = isLive
              ? (match.currentMinute ? `${match.currentMinute}'` : 'LIVE')
              : new Date(match.timestamp).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

            const homeIsFav = favouriteTeams.some((f) => f.toLowerCase() === (match.homeTeam?.name || '').toLowerCase());
            const awayIsFav = favouriteTeams.some((f) => f.toLowerCase() === (match.awayTeam?.name || '').toLowerCase());

            return (
              <div
                key={match.id}
                className="group relative rounded-[22px] bg-white hover:bg-slate-50/80 border border-slate-200/90 hover:border-emerald-500/40 p-4 shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 flex flex-col justify-between"
              >
                {/* Top: Tournament & Live indicator */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-bold text-slate-500 truncate max-w-[170px]">
                    {match.tournament || 'Live Tournament'}
                  </span>
                  {isLive ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black tracking-wide">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                      {timeStr}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                      {timeStr}
                    </span>
                  )}
                </div>

                {/* Teams & Scores */}
                <div className="space-y-2 py-1">
                  {/* Home team */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <TeamBadge team={match.homeTeam} name={match.homeTeam?.name} />
                      <Link href={`/teams/${encodeURIComponent(match.homeTeam?.name || 'Home Team')}`} onClick={(e) => e.stopPropagation()} className="text-[12.5px] font-bold text-slate-800 truncate hover:text-emerald-700">
                        {match.homeTeam?.name || 'Home Team'}
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFavourite(match.homeTeam?.name);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-slate-400 hover:text-amber-500"
                        title={homeIsFav ? 'Remove from favourites' : 'Star team'}
                      >
                        <Star className={`w-3 h-3 ${homeIsFav ? 'text-amber-500 fill-amber-500 !opacity-100' : ''}`} />
                      </button>
                    </div>
                    {isLive && match.homeScore !== null && (
                      <span className="text-sm font-black text-slate-900 pl-2 tabular-nums">
                        {match.homeScore}
                      </span>
                    )}
                  </div>

                  {/* Away team */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <TeamBadge team={match.awayTeam} name={match.awayTeam?.name} />
                      <Link href={`/teams/${encodeURIComponent(match.awayTeam?.name || 'Away Team')}`} onClick={(e) => e.stopPropagation()} className="text-[12.5px] font-bold text-slate-800 truncate hover:text-emerald-700">
                        {match.awayTeam?.name || 'Away Team'}
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFavourite(match.awayTeam?.name);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-slate-400 hover:text-amber-500"
                        title={awayIsFav ? 'Remove from favourites' : 'Star team'}
                      >
                        <Star className={`w-3 h-3 ${awayIsFav ? 'text-amber-500 fill-amber-500 !opacity-100' : ''}`} />
                      </button>
                    </div>
                    {isLive && match.awayScore !== null && (
                      <span className="text-sm font-black text-slate-900 pl-2 tabular-nums">
                        {match.awayScore}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer action: Watch Match button that takes the user to /watch/[id] */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-semibold">
                    {match.sources?.length ? `${match.sources.length} active feeds` : 'Stream Ready'}
                  </span>

                  <Link
                    href={`/watch/${match.id}`}
                    onClick={() => playMatch(match)}
                    className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 hover:text-emerald-800 group-hover:translate-x-0.5 transition-all"
                  >
                    <span>Watch Match</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
