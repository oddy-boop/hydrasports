'use client';

import React, { useState, useMemo } from 'react';
import FootyHeroBanner from './HydraHeroBanner';
import MatchCard from './MatchCard';
import AdBanner from './AdBanner';
import { useHydraSports } from './HydraContext';
import { ChevronDown, ExternalLink, Radio } from 'lucide-react';
import { matchBelongsToLeague, normalizeSport } from './leagueMatcher';

const wrestlingChannels = [
  {
    name: 'WWE',
    channelId: 'UCJ5v_MCY6GNUBTO8-D3XoAg',
    href: 'https://www.youtube.com/@WWE/streams',
  },
  {
    name: 'NWA',
    channelId: 'UCSHCTJS2P4Hvu_reLKtiT6g',
    href: 'https://www.youtube.com/@NWA/streams',
  },
  {
    name: 'MLW',
    channelId: 'UCNL6kCWxguQeQ8zQlV1E_kA',
    href: 'https://www.youtube.com/@MLW/streams',
    archiveHref: 'https://www.tubitv.com/search/mlw',
  },
];

export default function FootyHomePage({ initialMatches = [] }) {
  const {
    selectedLeague = 'Serie A',
    activeSport = 'Football',
    searchQuery = '',
  } = useHydraSports();
  const [filterMode, setFilterMode] = useState('featured'); // 'featured' | 'live' | 'all'
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [wrestlingChannel, setWrestlingChannel] = useState(wrestlingChannels[0]);
  const isWrestling = normalizeSport(activeSport) === 'wrestling';

  // Filter matches based on activeSport, searchQuery, selectedLeague, and filterMode
  const displayedMatches = useMemo(() => {
    let list = initialMatches || [];

    // 1. Filter by activeSport
    if (activeSport) {
      const target = normalizeSport(activeSport);
      list = list.filter(m => normalizeSport(m.sport) === target);
    }

    // 2. Filter by search query if user typed into topbar search
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(m =>
        m.title?.toLowerCase().includes(q) ||
        m.homeTeam?.name?.toLowerCase().includes(q) ||
        m.awayTeam?.name?.toLowerCase().includes(q) ||
        m.tournament?.toLowerCase().includes(q)
      );
    }

    // 3. Filter by selected league if football and not 'All'
    if (normalizeSport(activeSport) === 'football' && selectedLeague && selectedLeague !== 'All') {
      const leagueMatches = list.filter(m => matchBelongsToLeague(m, selectedLeague));
      if (leagueMatches.length > 0) {
        list = leagueMatches;
      }
    }

    // 4. Status filter mode
    if (filterMode === 'live') {
      list = list.filter(m => m.status === 'live');
    } else if (filterMode === 'featured') {
      // Prioritize live matches, then high priority
      list = [...list].sort((a, b) => {
        if (a.status === 'live' && b.status !== 'live') return -1;
        if (b.status === 'live' && a.status !== 'live') return 1;
        return (a.priority || 5) - (b.priority || 5);
      });
    }

    return list;
  }, [initialMatches, activeSport, searchQuery, selectedLeague, filterMode]);

  // Top featured match for Hero Banner from active selection
  const topMatch = useMemo(() => {
    if (!displayedMatches || displayedMatches.length === 0) {
      return null;
    }
    return displayedMatches.find((m) => m.status === 'live') ||
      displayedMatches.find((m) => m.status !== 'finished') ||
      displayedMatches[0];
  }, [displayedMatches]);

  const leagueTitle = useMemo(() => {
    if (searchQuery && searchQuery.trim()) {
      return `Search: "${searchQuery.trim()}"`;
    }
    if (normalizeSport(activeSport) === 'wrestling') {
      return 'Free Wrestling Streams & Episodes';
    }
    if (activeSport && normalizeSport(activeSport) !== 'football') {
      return `${activeSport} Matches`;
    }
    if (selectedLeague && selectedLeague !== 'All') {
      return `${selectedLeague} Match`;
    }
    return 'Featured Matches';
  }, [searchQuery, activeSport, selectedLeague]);

  return (
    <div className="space-y-6">
      {/* 1. Super Big Match Hero Banner (Image 1) */}
      {topMatch && <FootyHeroBanner featuredMatch={topMatch} />}

      {/* In-Feed Sponsor / Monetization Ad Slot */}
      <AdBanner slot="inContent" />

      {/* 2. Matches Section Header with Dropdown Filter (Image 1) */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
            {leagueTitle}
          </h3>

          {/* Filter Dropdown: "Featured Match ▾" */}
          {(!isWrestling || displayedMatches.length > 0) && (
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
          )}
        </div>

        {/* 3. Match Grid: 2-Columns as shown in Image 1 */}
        {displayedMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        ) : isWrestling ? (
          <div className="rounded-2xl bg-[#1c1a2d] border border-white/[0.06] p-5 sm:p-6">
            <div className="flex items-start gap-3 mb-5">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-purple-300">
                <Radio className="h-4 w-4" />
              </span>
              <div>
                <h4 className="text-sm font-extrabold text-white">Official live wrestling</h4>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  Watch public live broadcasts from official YouTube channels here. A stream appears only while the promotion is live and has enabled embedding; availability varies by event and region.
                </p>
              </div>
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              {wrestlingChannels.map((channel) => (
                <button
                  key={channel.name}
                  type="button"
                  onClick={() => setWrestlingChannel(channel)}
                  aria-pressed={wrestlingChannel.name === channel.name}
                  className={`rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${
                    wrestlingChannel.name === channel.name
                      ? 'border-purple-400/60 bg-purple-500/20 text-white'
                      : 'border-white/10 bg-[#211f35] text-slate-300 hover:text-white'
                  }`}
                >
                  {channel.name}
                </button>
              ))}
            </div>
            <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
              <iframe
                key={wrestlingChannel.channelId}
                title={`${wrestlingChannel.name} official live stream`}
                src={`https://www.youtube.com/embed/live_stream?channel=${wrestlingChannel.channelId}`}
                className="aspect-video w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-400">
                If no broadcast is live or embedding is unavailable, check the promotion’s official channel.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href={wrestlingChannel.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-300 transition-colors hover:text-white"
                >
                  Official {wrestlingChannel.name} streams
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                {wrestlingChannel.archiveHref && (
                  <a
                    href={wrestlingChannel.archiveHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-300 transition-colors hover:text-white"
                  >
                    Free MLW episodes on Tubi
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
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
