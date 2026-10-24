'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useHydraSports } from './HydraContext';
import { Trophy, Newspaper, ExternalLink, Loader2, X, ChevronRight, ChevronDown } from 'lucide-react';

const SUPPORTED_LEAGUES_TABLE = [
  { id: 'Premier League', name: 'Premier League (ENG)' },
  { id: 'La Liga', name: 'La Liga (ESP)' },
  { id: 'Serie A', name: 'Serie A (ITA)' },
  { id: 'Bundesliga', name: 'Bundesliga (GER)' },
  { id: 'Champions League', name: 'UEFA Champions League' },
  { id: 'Ligue 1', name: 'Ligue 1 (FRA)' },
  { id: 'MLS', name: 'Major League Soccer (USA)' },
  { id: 'Eredivisie', name: 'Dutch Eredivisie (NED)' },
  { id: 'Brasileiro', name: 'Brasileirão Série A (BRA)' },
  { id: 'SAF Primera', name: 'SAF Primera (ARG)' },
];

const QUICK_LEAGUES = [
  { id: 'Premier League', label: 'EPL' },
  { id: 'La Liga', label: 'La Liga' },
  { id: 'Serie A', label: 'Serie A' },
  { id: 'Bundesliga', label: 'Bundesliga' },
  { id: 'Champions League', label: 'UCL' },
];

export default function HydraSportsActivityRail() {
  const { selectedLeague = 'Premier League', selectLeague } = useHydraSports();
  const [cardLeague, setCardLeague] = useState(
    selectedLeague && selectedLeague !== 'All' ? selectedLeague : 'Premier League'
  );
  const [mobileTab, setMobileTab] = useState('standings');
  const [standings, setStandings] = useState([]);
  const [news, setNews] = useState([]);
  const [loadingStandings, setLoadingStandings] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);

  // Full table modal state
  const [fullTableOpen, setFullTableOpen] = useState(false);
  const [modalLeague, setModalLeague] = useState(cardLeague);
  const [modalStandings, setModalStandings] = useState([]);
  const [loadingModalStandings, setLoadingModalStandings] = useState(false);
  const [selectedNewsArticle, setSelectedNewsArticle] = useState(null);

  // Sync cardLeague if selectedLeague from context changes and is not 'All'
  useEffect(() => {
    if (selectedLeague && selectedLeague !== 'All') {
      setCardLeague(selectedLeague);
    }
  }, [selectedLeague]);

  // Fetch real league standings for sidebar & mobile
  useEffect(() => {
    let cancelled = false;
    const fetchStandings = async () => {
      setLoadingStandings(true);
      try {
        const query = cardLeague || 'Premier League';
        const res = await fetch(`/api/standings?league=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error('Standings failed');
        const data = await res.json();
        if (!cancelled && Array.isArray(data.entries)) {
          setStandings(data.entries);
        }
      } catch {
        if (!cancelled) setStandings([]);
      } finally {
        if (!cancelled) setLoadingStandings(false);
      }
    };

    fetchStandings();
    return () => { cancelled = true; };
  }, [cardLeague]);

  // Fetch standings for modal when modal is open or modalLeague changes
  useEffect(() => {
    if (!fullTableOpen) return;
    let cancelled = false;
    const fetchModalStandings = async () => {
      setLoadingModalStandings(true);
      try {
        const res = await fetch(`/api/standings?league=${encodeURIComponent(modalLeague)}`);
        if (!res.ok) throw new Error('Modal Standings failed');
        const data = await res.json();
        if (!cancelled && Array.isArray(data.entries)) {
          setModalStandings(data.entries);
        }
      } catch {
        if (!cancelled) setModalStandings([]);
      } finally {
        if (!cancelled) setLoadingModalStandings(false);
      }
    };

    fetchModalStandings();
    return () => { cancelled = true; };
  }, [fullTableOpen, modalLeague]);

  // Fetch real sports news from ESPN
  useEffect(() => {
    let cancelled = false;
    const fetchNews = async () => {
      setLoadingNews(true);
      try {
        const res = await fetch('/api/news');
        if (!res.ok) throw new Error('News failed');
        const data = await res.json();
        if (!cancelled && Array.isArray(data.articles)) {
          setNews(data.articles);
        }
      } catch {
        if (!cancelled) setNews([]);
      } finally {
        if (!cancelled) setLoadingNews(false);
      }
    };

    fetchNews();
    return () => { cancelled = true; };
  }, []);

  const leagueTitle = `${cardLeague} Table`;

  const featuredNews = news[0] || {
    headline: 'European football round-up: Champions League contenders prepare for decisive week',
    description: 'Teams battle across domestic leagues ahead of the next round of continental fixtures.',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800',
  };

  return (
    <>
      <aside className="w-[300px] xl:w-[320px] shrink-0 p-4 space-y-4 hidden lg:flex flex-col bg-[#141221] border-l border-white/[0.06] overflow-y-auto fixed top-[68px] right-0 bottom-0 z-30">
        
        {/* ── CARD 1: League Standings ── */}
        <div className="rounded-2xl bg-[#1c1a2d] border border-white/[0.06] p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[13px] font-extrabold text-white tracking-tight flex items-center gap-1.5 truncate">
              <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{leagueTitle}</span>
            </h3>

            {/* Clickable "Full Table" button */}
            <button
              type="button"
              onClick={() => {
                setModalLeague(cardLeague);
                setFullTableOpen(true);
              }}
              className="text-[11px] font-extrabold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 shrink-0 cursor-pointer px-2 py-0.5 rounded-md hover:bg-purple-600/10"
              title="Click to view full 20-team standings table"
            >
              <span>Full Table</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* League Dropdown Selector (Replaces horizontal scroll) */}
          <div className="mb-3 w-full relative">
            <label htmlFor="rail-league-select" className="sr-only">Select Standings League</label>
            <div className="relative">
              <select
                id="rail-league-select"
                value={cardLeague}
                onChange={(e) => setCardLeague(e.target.value)}
                className="w-full h-8 px-2.5 pr-8 rounded-lg bg-[#1c1a2d] border border-white/15 text-xs font-bold text-purple-300 outline-none focus:border-purple-500 cursor-pointer appearance-none shadow-sm"
              >
                {SUPPORTED_LEAGUES_TABLE.map((lg) => (
                  <option key={lg.id} value={lg.id} className="bg-[#1c1a2d] text-white font-medium">
                    {lg.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-purple-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 text-[10px] font-bold text-slate-400 border-b border-white/[0.06] pb-2 mb-2 px-1">
            <div className="col-span-2">Pos</div>
            <div className="col-span-5">Team</div>
            <div className="col-span-1 text-center">W</div>
            <div className="col-span-1 text-center">D</div>
            <div className="col-span-1 text-center">L</div>
            <div className="col-span-2 text-right">Pts</div>
          </div>

          {/* Table Rows (Top 8 for compact sidebar) */}
          {loadingStandings ? (
            <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
              <span className="text-[10px]">Loading real standings...</span>
            </div>
          ) : standings.length > 0 ? (
            <div className="space-y-1">
              {standings.slice(0, 8).map((row) => (
                <div 
                  key={row.team?.id || row.rank}
                  className="grid grid-cols-12 items-center text-[11px] py-1.5 px-1 rounded-lg hover:bg-white/[0.04] transition-colors font-medium text-slate-300 cursor-pointer"
                  onClick={() => {
                    setModalLeague(cardLeague);
                    setFullTableOpen(true);
                  }}
                >
                  <div className="col-span-2 font-bold text-slate-400 text-[10.5px]">
                    {row.rank}
                  </div>
                  <div className="col-span-5 flex items-center gap-1.5 truncate pr-1">
                    {row.team?.logo ? (
                      <img src={row.team.logo} alt="" className="w-3.5 h-3.5 object-contain shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full bg-slate-700 shrink-0" />
                    )}
                    <span className="truncate text-white text-[11px] font-semibold" title={row.team?.displayName}>
                      {row.team?.displayName || row.team?.name}
                    </span>
                  </div>
                  <div className="col-span-1 text-center text-slate-300 text-[10px]">{row.wins}</div>
                  <div className="col-span-1 text-center text-slate-400 text-[10px]">{row.ties}</div>
                  <div className="col-span-1 text-center text-slate-400 text-[10px]">{row.losses}</div>
                  <div className="col-span-2 text-right font-black text-white text-[11px]">{row.points}</div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  setModalLeague(cardLeague);
                  setFullTableOpen(true);
                }}
                className="w-full mt-2 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white text-[11px] font-bold text-center transition-all cursor-pointer border border-white/5"
              >
                View Complete Table ({standings.length} Teams) →
              </button>
            </div>
          ) : (
            <div className="py-6 text-center text-[11px] text-slate-400">
              Standings resolving for current fixtures...
            </div>
          )}
        </div>

        {/* ── CARD 2: Real Sports News Feed (Multiple Stories) ── */}
        <div className="rounded-2xl bg-[#1c1a2d] border border-white/[0.06] p-4 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-extrabold text-white tracking-tight flex items-center gap-2">
              <Newspaper className="w-3.5 h-3.5 text-purple-400" />
              <span>Latest News ({news.length || 1})</span>
            </h3>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Live Feed
            </span>
          </div>

          {/* Lead Top Headline News Card with Image */}
          <div 
            onClick={() => setSelectedNewsArticle(featuredNews)}
            className="relative rounded-xl overflow-hidden bg-slate-900 border border-white/[0.06] group cursor-pointer transition-transform hover:scale-[1.01]"
          >
            <div className="relative aspect-video w-full overflow-hidden">
              <img 
                src={featuredNews.image} 
                alt={featuredNews.headline} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e0c18] via-[#0e0c18]/60 to-transparent" />
            </div>

            <div className="p-3 relative z-10 -mt-10">
              <h4 className="text-[12px] font-black text-white leading-snug line-clamp-2 group-hover:text-purple-300 transition-colors">
                {featuredNews.headline}
              </h4>
              <p className="text-[10px] text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                {featuredNews.description}
              </p>
              <span className="text-[9.5px] text-purple-400 font-bold mt-2 flex items-center gap-1 group-hover:underline">
                <span>Click to read story</span>
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Multiple Additional News Articles Feed */}
          {news.length > 1 && (
            <div className="mt-3 pt-2.5 border-t border-white/[0.06] space-y-2.5">
              {news.slice(1, 6).map((item, idx) => (
                <div 
                  key={item.id || idx} 
                  onClick={() => setSelectedNewsArticle(item)}
                  className="flex items-start gap-2.5 p-1.5 rounded-xl hover:bg-white/[0.04] transition-colors group cursor-pointer"
                >
                  {item.image && (
                    <div className="w-12 h-10 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-white/10">
                      <img src={item.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-slate-200 group-hover:text-purple-300 line-clamp-2 transition-colors leading-snug">
                      {item.headline}
                    </p>
                    <span className="text-[9.5px] text-slate-400 mt-0.5 block">
                      {item.published ? new Date(item.published).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Verified Sports Feed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </aside>

      {/* ── MOBILE SECTION: Standings & News (Visible only on < lg screens) ── */}
      <section className="block lg:hidden w-full px-3 sm:px-5 py-6 bg-[#141221] border-t border-white/[0.08] space-y-4">
        {/* Mobile Tab Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-[#1c1a2d] border border-white/[0.08]">
          <button
            type="button"
            onClick={() => setMobileTab('standings')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              mobileTab === 'standings'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>League Standings</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('news')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              mobileTab === 'news'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5 text-purple-400" />
            <span>Sports News ({news.length || 0})</span>
          </button>
        </div>

        {mobileTab === 'standings' && (
          <div className="rounded-2xl bg-[#1c1a2d] border border-white/[0.06] p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{cardLeague} Table</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setModalLeague(cardLeague);
                  setFullTableOpen(true);
                }}
                className="text-xs font-extrabold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 cursor-pointer px-2 py-1 rounded-md bg-purple-600/10"
              >
                <span>Full Table</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* League Dropdown on mobile (Replaces horizontal scroll) */}
            <div className="mb-3 w-full relative">
              <label htmlFor="mobile-rail-league-select" className="sr-only">Select Standings League</label>
              <div className="relative">
                <select
                  id="mobile-rail-league-select"
                  value={cardLeague}
                  onChange={(e) => setCardLeague(e.target.value)}
                  className="w-full h-8 px-2.5 pr-8 rounded-lg bg-[#1c1a2d] border border-white/15 text-xs font-bold text-purple-300 outline-none focus:border-purple-500 cursor-pointer appearance-none shadow-sm"
                  title="Switch League"
                >
                  {SUPPORTED_LEAGUES_TABLE.map((lg) => (
                    <option key={lg.id} value={lg.id} className="bg-[#1c1a2d] text-white">
                      {lg.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-purple-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 text-[11px] font-bold text-slate-400 border-b border-white/[0.06] pb-2 mb-2 px-1">
              <div className="col-span-2">Pos</div>
              <div className="col-span-5">Team</div>
              <div className="col-span-1 text-center">W</div>
              <div className="col-span-1 text-center">D</div>
              <div className="col-span-1 text-center">L</div>
              <div className="col-span-2 text-right">Pts</div>
            </div>

            {loadingStandings ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                <span className="text-xs">Loading standings...</span>
              </div>
            ) : standings.length > 0 ? (
              <div className="space-y-1">
                {standings.slice(0, 10).map((row) => (
                  <div
                    key={row.team?.id || row.rank}
                    onClick={() => {
                      setModalLeague(cardLeague);
                      setFullTableOpen(true);
                    }}
                    className="grid grid-cols-12 items-center text-xs py-2 px-1 rounded-lg hover:bg-white/[0.04] transition-colors font-medium text-slate-300 cursor-pointer"
                  >
                    <div className="col-span-2 font-bold text-slate-400 text-xs">
                      {row.rank}
                    </div>
                    <div className="col-span-5 flex items-center gap-2 truncate pr-1">
                      {row.team?.logo ? (
                        <img src={row.team.logo} alt="" className="w-4 h-4 object-contain shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-slate-700 shrink-0" />
                      )}
                      <span className="truncate text-white text-xs font-semibold">
                        {row.team?.displayName || row.team?.name}
                      </span>
                    </div>
                    <div className="col-span-1 text-center text-slate-300 text-xs">{row.wins}</div>
                    <div className="col-span-1 text-center text-slate-400 text-xs">{row.ties}</div>
                    <div className="col-span-1 text-center text-slate-400 text-xs">{row.losses}</div>
                    <div className="col-span-2 text-right font-black text-white text-xs text-purple-300">{row.points}</div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setModalLeague(cardLeague);
                    setFullTableOpen(true);
                  }}
                  className="w-full mt-3 py-2 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 text-purple-300 text-xs font-bold text-center transition-all cursor-pointer border border-purple-500/20"
                >
                  View Complete Table ({standings.length} Teams) →
                </button>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                Standings resolving for current fixtures...
              </div>
            )}
          </div>
        )}

        {mobileTab === 'news' && (
          <div className="rounded-2xl bg-[#1c1a2d] border border-white/[0.06] p-4 shadow-xl flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-purple-400" />
                <span>Latest Sports News</span>
              </h3>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Live Feed
              </span>
            </div>

            {/* Lead story */}
            <div
              onClick={() => setSelectedNewsArticle(featuredNews)}
              className="relative rounded-xl overflow-hidden bg-slate-900 border border-white/[0.06] group cursor-pointer"
            >
              <div className="relative aspect-video w-full overflow-hidden">
                <img
                  src={featuredNews.image}
                  alt={featuredNews.headline}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0c18] via-[#0e0c18]/60 to-transparent" />
              </div>
              <div className="p-3 relative z-10 -mt-10">
                <h4 className="text-xs font-black text-white leading-snug">
                  {featuredNews.headline}
                </h4>
                <p className="text-[10.5px] text-slate-400 mt-1 line-clamp-2">
                  {featuredNews.description}
                </p>
                <span className="text-[10px] text-purple-400 font-bold mt-2 flex items-center gap-1">
                  <span>Read full story</span>
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* Additional stories */}
            {news.slice(1, 8).map((item, idx) => (
              <div
                key={item.id || idx}
                onClick={() => setSelectedNewsArticle(item)}
                className="flex items-start gap-2.5 p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] cursor-pointer"
              >
                {item.image && (
                  <div className="w-16 h-12 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-white/10">
                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-200 line-clamp-2 leading-snug">
                    {item.headline}
                  </p>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {item.published ? new Date(item.published).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sports Feed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── FULL STANDINGS MODAL ── */}
      {fullTableOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-4xl max-h-[90vh] rounded-[28px] bg-[#141221] border border-white/15 p-5 md:p-7 shadow-2xl flex flex-col text-white overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-black text-white tracking-tight flex items-center gap-2">
                    <span>Official League Standings</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Full comparative rankings, match statistics, and points table
                  </p>
                </div>
              </div>

              {/* League Selector inside Modal */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={modalLeague}
                    onChange={(e) => setModalLeague(e.target.value)}
                    className="h-9 px-3 pr-8 rounded-xl bg-[#1c1a2d] border border-white/15 text-xs font-bold text-white outline-none cursor-pointer appearance-none"
                  >
                    {SUPPORTED_LEAGUES_TABLE.map((lg) => (
                      <option key={lg.id} value={lg.id} className="bg-[#1c1a2d] text-white">
                        {lg.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <button
                  type="button"
                  onClick={() => setFullTableOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Table Content */}
            <div className="flex-1 overflow-y-auto overflow-x-auto mt-4 pr-1">
              {loadingModalStandings ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <Loader2 className="w-7 h-7 animate-spin text-purple-400" />
                  <span className="text-xs font-bold">Fetching verified {modalLeague} table...</span>
                </div>
              ) : modalStandings.length > 0 ? (
                <div className="w-full min-w-[460px] sm:min-w-[560px]">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 text-xs font-black uppercase tracking-wider text-slate-400 border-b border-white/10 pb-2.5 px-3">
                    <div className="col-span-1">Pos</div>
                    <div className="col-span-4">Club</div>
                    <div className="col-span-1 text-center">GP</div>
                    <div className="col-span-1 text-center">W</div>
                    <div className="col-span-1 text-center">D</div>
                    <div className="col-span-1 text-center">L</div>
                    <div className="col-span-2 text-center">GD</div>
                    <div className="col-span-2 text-right">Pts</div>
                  </div>

                  {/* Rows */}
                  <div className="divide-y divide-white/[0.04]">
                    {modalStandings.map((row) => (
                      <div
                        key={row.team?.id || row.rank}
                        className={`grid grid-cols-12 items-center text-xs py-2.5 px-3 rounded-xl transition-colors font-medium ${
                          row.rank <= 4
                            ? 'bg-purple-600/[0.07] text-white'
                            : row.rank >= modalStandings.length - 2
                            ? 'bg-red-500/[0.04] text-slate-300'
                            : 'hover:bg-white/[0.04] text-slate-300'
                        }`}
                      >
                        <div className="col-span-1 font-black text-slate-300">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs ${
                            row.rank === 1 ? 'bg-amber-400/20 text-amber-300 font-black' :
                            row.rank <= 4 ? 'bg-purple-500/20 text-purple-300 font-bold' : ''
                          }`}>
                            {row.rank}
                          </span>
                        </div>
                        <div className="col-span-4 flex items-center gap-2.5 truncate pr-2">
                          {row.team?.logo ? (
                            <img src={row.team.logo} alt="" className="w-5 h-5 object-contain shrink-0" />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-slate-700 shrink-0" />
                          )}
                          <span className="truncate font-bold text-white text-[13px]">
                            {row.team?.displayName || row.team?.name}
                          </span>
                        </div>
                        <div className="col-span-1 text-center text-slate-400 font-semibold">{row.gamesPlayed || (row.wins + row.ties + row.losses)}</div>
                        <div className="col-span-1 text-center text-slate-200 font-bold">{row.wins}</div>
                        <div className="col-span-1 text-center text-slate-400">{row.ties}</div>
                        <div className="col-span-1 text-center text-slate-400">{row.losses}</div>
                        <div className="col-span-2 text-center text-slate-300 font-mono">{row.goalDiff}</div>
                        <div className="col-span-2 text-right font-black text-white text-sm tabular-nums text-purple-300">
                          {row.points}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-sm text-slate-400">
                  No table data currently available for {modalLeague}.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-4 mt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 shrink-0">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-purple-500" /> Champions League / Promotion</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-red-500" /> Relegation zone</span>
              </div>
              <button
                type="button"
                onClick={() => setFullTableOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── NEWS READER MODAL ── */}
      {selectedNewsArticle && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-[28px] bg-[#141221] border border-white/15 p-5 md:p-6 shadow-2xl flex flex-col text-white overflow-hidden space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-[11px] font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <Newspaper className="w-3.5 h-3.5" />
                <span>ESPN Sports Breaking News</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedNewsArticle(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedNewsArticle.image && (
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-slate-900">
                <img
                  src={selectedNewsArticle.image}
                  alt={selectedNewsArticle.headline}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div>
              <h3 className="text-base font-black text-white leading-snug">
                {selectedNewsArticle.headline}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Published {selectedNewsArticle.published ? new Date(selectedNewsArticle.published).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Verified Sports Wire'}
              </p>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {selectedNewsArticle.description || 'Full coverage and verified game telemetry available on the official ESPN sports network.'}
            </p>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedNewsArticle(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
              {selectedNewsArticle.link && selectedNewsArticle.link !== '#' && (
                <a
                  href={selectedNewsArticle.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition-all cursor-pointer"
                >
                  <span>Read Full Story on ESPN</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}