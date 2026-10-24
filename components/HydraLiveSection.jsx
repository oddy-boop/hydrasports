'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Play, Radio, Calendar, Trophy, ChevronRight, Star, Layers, Check } from 'lucide-react';
import { useHydraSports } from './HydraContext';
import { matchBelongsToLeague, COMPETITIONS_LIST, POPULAR_TEAMS } from './leagueMatcher';
import MatchCard from './MatchCard';

export default function HydraSportsSection({ matches = [], teamFilter = '' }) {
  const {
    searchQuery,
    selectedLeague,
    selectLeague,
    activeMenu,
    selectMenu,
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
    <section ref={sectionRef} className="mt-4 mb-8 scroll-mt-24 text-white">
      {/* Competitions Shelf (visible when Competitions is selected or user chooses) */}
      {activeMenu === 'competitions' && (
        <div className="mb-8 p-5 rounded-[24px] bg-[#181627] border border-white/10 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-purple-400" />
              <h4 className="text-base font-extrabold text-white">
                Competitions & Leagues
              </h4>
            </div>
            <span className="text-xs font-semibold text-slate-400">
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
                      ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/30 scale-[1.02]'
                      : 'bg-[#1e1c32] hover:bg-[#25233e] border-white/10 text-slate-200 hover:border-purple-500/40'
                  }`}
                >
                  <div className="text-xl mb-1">{comp.flag}</div>
                  <div className="text-xs font-extrabold truncate">{comp.name}</div>
                  <div className={`text-[10px] mt-0.5 font-bold ${isSelected ? 'text-purple-200' : 'text-slate-400'}`}>
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
        <div className="mb-6 p-5 rounded-[24px] bg-[#181627] border border-amber-500/30 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <h4 className="text-sm font-extrabold text-white">
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
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                      : 'bg-[#1e1c32] hover:bg-[#26243d] text-slate-300 border border-white/10'
                  }`}
                >
                  <Star className={`w-3 h-3 ${isFav ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
                  <span>{team}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Header with Title and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
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
              <span className="inline-flex items-center gap-1 text-[11px] font-black bg-purple-600/30 text-purple-300 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                <span>{selectedLeague}</span>
                <button
                  type="button"
                  onClick={() => selectLeague('All')}
                  className="hover:text-white font-black ml-0.5 cursor-pointer"
                  title="Clear filter"
                >
                  ×
                </button>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Live scores and streams aggregated across real verified providers
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#1c1a2d] px-3 py-1.5 text-[11px] font-bold text-slate-300">
            <span className="text-slate-400">Sort</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="cursor-pointer bg-transparent font-extrabold text-white outline-none"
              aria-label="Sort matches"
            >
              <option value="priority" className="bg-[#1c1a2d] text-white">Live priority</option>
              <option value="kickoff" className="bg-[#1c1a2d] text-white">Kickoff time</option>
              <option value="competition" className="bg-[#1c1a2d] text-white">Competition</option>
              <option value="sport" className="bg-[#1c1a2d] text-white">Sport</option>
            </select>
          </label>

          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#161426] p-1">
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
                className={`px-3 py-1 rounded-lg text-[11px] font-extrabold capitalize transition-all cursor-pointer ${
                  filterTab === t
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {t === 'all' ? 'All Matches' : t === 'finished' ? 'Past Results' : t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Match Cards 2-Column Grid (Image 1 Layout) */}
      {filteredMatches.length === 0 ? (
        <div className="p-8 text-center rounded-[24px] bg-[#181627] border border-white/10">
          <p className="text-xs font-bold text-slate-400">
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
              className="mt-3 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition-all cursor-pointer"
            >
              Show All Fixtures
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </section>
  );
}
