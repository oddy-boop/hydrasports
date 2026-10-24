'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useHydraSports } from './HydraContext';
import { Trophy, Newspaper, ExternalLink, Loader2 } from 'lucide-react';

export default function HydraSportsActivityRail() {
  const { selectedLeague = 'Serie A' } = useHydraSports();
  const [standings, setStandings] = useState([]);
  const [news, setNews] = useState([]);
  const [loadingStandings, setLoadingStandings] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);

  // Fetch real league standings
  useEffect(() => {
    let cancelled = false;
    const fetchStandings = async () => {
      setLoadingStandings(true);
      try {
        const query = selectedLeague && selectedLeague !== 'All' ? selectedLeague : 'Serie A';
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
  }, [selectedLeague]);

  // Fetch real football news
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

  const leagueTitle = selectedLeague && selectedLeague !== 'All' 
    ? `${selectedLeague} Standings` 
    : 'SerieA Standings';

  const featuredNews = news[0] || {
    headline: 'De Laurentiis all smiles after Napoli win over Udinese',
    description: 'The Partenopei have looked shaky in the early stages of the new season and tensions were sky high.',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800',
  };

  return (
    <aside className="w-[300px] xl:w-[320px] shrink-0 p-4 space-y-4 hidden lg:flex flex-col bg-[#141221] border-l border-white/[0.06] overflow-y-auto max-h-[calc(100vh-68px)] sticky top-[68px]">
      
      {/* ── CARD 1: League Standings (Image 1) ── */}
      <div className="rounded-2xl bg-[#1c1a2d] border border-white/[0.06] p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>{leagueTitle}</span>
          </h3>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 text-[10px] font-bold text-slate-400 border-b border-white/[0.06] pb-2 mb-2 px-1">
          <div className="col-span-2">Pos</div>
          <div className="col-span-4">Team</div>
          <div className="col-span-1 text-center">W</div>
          <div className="col-span-1 text-center">D</div>
          <div className="col-span-1 text-center">L</div>
          <div className="col-span-1 text-center">GD</div>
          <div className="col-span-2 text-right">Pts</div>
        </div>

        {/* Table Rows (Real ESPN Data) */}
        {loadingStandings ? (
          <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
            <span className="text-[10px]">Loading real standings...</span>
          </div>
        ) : standings.length > 0 ? (
          <div className="space-y-1">
            {standings.slice(0, 10).map((row) => (
              <div 
                key={row.team.id}
                className="grid grid-cols-12 items-center text-[11px] py-1.5 px-1 rounded-lg hover:bg-white/[0.04] transition-colors font-medium text-slate-300"
              >
                <div className="col-span-2 font-bold text-slate-400 text-[10.5px]">
                  {row.rank}
                </div>
                <div className="col-span-4 flex items-center gap-1.5 truncate pr-1">
                  {row.team.logo ? (
                    <img src={row.team.logo} alt="" className="w-3.5 h-3.5 object-contain shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full bg-slate-700 shrink-0" />
                  )}
                  <span className="truncate text-white text-[11px] font-semibold" title={row.team.displayName}>
                    {row.team.displayName}
                  </span>
                </div>
                <div className="col-span-1 text-center text-slate-300 text-[10px]">{row.wins}</div>
                <div className="col-span-1 text-center text-slate-400 text-[10px]">{row.ties}</div>
                <div className="col-span-1 text-center text-slate-400 text-[10px]">{row.losses}</div>
                <div className="col-span-1 text-center text-slate-400 text-[10px]">{row.goalDiff}</div>
                <div className="col-span-2 text-right font-black text-white text-[11px]">{row.points}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-[11px] text-slate-400">
            Standings resolving for current fixtures...
          </div>
        )}
      </div>

      {/* ── CARD 2: Real News Section (Image 1) ── */}
      <div className="rounded-2xl bg-[#1c1a2d] border border-white/[0.06] p-4 shadow-xl flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-extrabold text-white tracking-tight flex items-center gap-2">
            <Newspaper className="w-3.5 h-3.5 text-purple-400" />
            <span>News</span>
          </h3>
        </div>

        {/* Real News Card with Image & Headline */}
        <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-white/[0.06] group cursor-pointer">
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
          </div>
        </div>

        {/* Additional Real News Headlines if available */}
        {news.length > 1 && (
          <div className="mt-3 pt-2.5 border-t border-white/[0.06] space-y-2">
            {news.slice(1, 3).map((item) => (
              <div key={item.id} className="group cursor-pointer">
                <p className="text-[11px] font-bold text-slate-300 group-hover:text-purple-300 line-clamp-2 transition-colors">
                  {item.headline}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

    </aside>
  );
}
