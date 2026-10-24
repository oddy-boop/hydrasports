'use client';

import React, { useState, useMemo } from 'react';
import FootyHeroBanner from './HydraHeroBanner';
import MatchCard from './MatchCard';
import { useHydraSports } from './HydraContext';
import { ChevronDown, Radio } from 'lucide-react';
import { matchBelongsToLeague } from './leagueMatcher';

export default function FootyHomePage({ initialMatches = [] }) {
  const { selectedLeague = 'Serie A' } = useHydraSports();
  const [filterMode, setFilterMode] = useState('featured'); // 'featured' | 'live' | 'all'
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

  // Top featured match for Hero Banner
  const topMatch = useMemo(() => {
    if (!initialMatches || initialMatches.length === 0) return null;
    // Prefer match in selected league, else live match, else first match
    if (selectedLeague && selectedLeague !== 'All') {
      const leagueMatch = initialMatches.find(m => matchBelongsToLeague(m, selectedLeague) && m.status === 'live') ||
        initialMatches.find(m => matchBelongsToLeague(m, selectedLeague));
      if (leagueMatch) return leagueMatch;
    }
    return initialMatches.find((m) => m.status === 'live') ||
      initialMatches.find((m) => m.status !== 'finished') ||
      initialMatches[0];
  }, [initialMatches, selectedLeague]);

  // Filter matches based on selectedLeague and filterMode
  const displayedMatches = useMemo(() => {
    let list = initialMatches || [];

    // Filter by selected league if not 'All'
    if (selectedLeague && selectedLeague !== 'All') {
      const filtered = list.filter(m => matchBelongsToLeague(m, selectedLeague));
      if (filtered.length > 0) {
        list = filtered;
      }
    }

    if (filterMode === 'live') {
      list = list.filter(m => m.status === 'live');
    } else if (filterMode === 'featured') {
      // Prioritize live then high priority
      list = [...list].sort((a, b) => {
        if (a.status === 'live' && b.status !== 'live') return -1;
        if (b.status === 'live' && a.status !== 'live') return 1;
        return (a.priority || 5) - (b.priority || 5);
      });
    }

    return list;
  }, [initialMatches, selectedLeague, filterMode]);

  const leagueTitle = selectedLeague && selectedLeague !== 'All' 
    ? `${selectedLeague} Match` 
    : 'Serie A Match';

  return (
    <div className="space-y-6">
      {/* 1. Super Big Match Hero Banner (Image 1) */}
      <FootyHeroBanner featuredMatch={topMatch} />

      {/* 2. Matches Section Header with Dropdown Filter (Image 1) */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
            {leagueTitle}
          </h3>

          {/* Filter Dropdown: "Featured Match ▾" */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1c1a2d] border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
            >
              <span className="capitalize">
                {filterMode === 'featured' ? 'Featured Match' : filterMode === 'live' ? 'Live Matches' : 'All Matches'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {filterDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-40 rounded-xl bg-[#1c1a2d] border border-white/15 p-1 shadow-2xl z-20">
                <button
                  type="button"
                  onClick={() => { setFilterMode('featured'); setFilterDropdownOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    filterMode === 'featured' ? 'bg-purple-600/30 text-white' : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  Featured Match
                </button>
                <button
                  type="button"
                  onClick={() => { setFilterMode('live'); setFilterDropdownOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    filterMode === 'live' ? 'bg-purple-600/30 text-white' : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  Live Matches
                </button>
                <button
                  type="button"
                  onClick={() => { setFilterMode('all'); setFilterDropdownOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    filterMode === 'all' ? 'bg-purple-600/30 text-white' : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  All Matches
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 3. Match Grid: 2-Columns as shown in Image 1 */}
        {displayedMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        ) : (
          <div className="py-12 rounded-2xl bg-[#1c1a2d] border border-white/[0.06] text-center p-6 text-slate-400 text-xs">
            No live or scheduled fixtures found in this category right now.
          </div>
        )}
      </div>
    </div>
  );
}
