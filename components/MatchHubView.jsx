'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Trophy,
  ChevronDown,
  LayoutGrid,
  BarChart2,
  Calendar,
  Users,
  Search,
  Bell,
  ArrowLeft,
  Maximize2,
  RefreshCw,
  Heart,
  TrendingUp,
  Settings,
  Sparkles,
  X,
  Volume2,
  VolumeX,
} from 'lucide-react';
import StreamPlayer from './StreamPlayer';
import { useAuth } from './AuthContext';
import { parseMatchHubData } from '@/lib/utils/matchHubData';

export default function MatchHubView({
  match: initialMatch,
  stats: initialStats,
  streamUrl,
  channels = [],
  errorMsg = null,
}) {
  const router = useRouter();
  const { user } = useAuth();

  const [match, setMatch] = useState(initialMatch);
  const [stats, setStats] = useState(initialStats);
  const [activeTab, setActiveTab] = useState('lobby');
  const [selectedKeyPlayerTeam, setSelectedKeyPlayerTeam] = useState('home');
  const [selectedStatsTeam, setSelectedStatsTeam] = useState('home');
  const [activeChannelIdx, setActiveChannelIdx] = useState(0);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [showAiInsight, setShowAiInsight] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const containerRef = useRef(null);

  // Parse all HUD data dynamically
  const hubData = parseMatchHubData(match, stats);

  // Poll for live match score, minute, and stats updates every 15s if live
  const refreshMatchData = useCallback(async () => {
    if (!match?.id || match.status !== 'live') return;
    try {
      const res = await fetch(`/api/match/${match.id}`, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.match) {
        setMatch(prev => ({
          ...prev,
          homeScore: data.match.homeScore,
          awayScore: data.match.awayScore,
          currentMinute: data.match.currentMinute,
          currentMinuteNumber: data.match.currentMinuteNumber,
          status: data.match.status,
        }));
      }
      if (data.stats) {
        setStats(data.stats);
      }
    } catch {
      // Ignore background refresh errors
    }
  }, [match?.id, match?.status]);

  useEffect(() => {
    if (match?.status !== 'live') return;
    const interval = setInterval(refreshMatchData, 15000);
    return () => clearInterval(interval);
  }, [match?.status, refreshMatchData]);

  const tournamentName = (match.tournament || 'FIFA WORLD CUP 2026').toUpperCase();
  const currentChannels = channels.length > 0 ? channels : [{ name: 'HD Feed 1', url: streamUrl, proxiedUrl: streamUrl }];
  const currentStreamUrl = currentChannels[activeChannelIdx]?.proxiedUrl || currentChannels[activeChannelIdx]?.url || streamUrl;

  const activeKeyPlayers = selectedKeyPlayerTeam === 'home' ? hubData.homeKeyPlayers : hubData.awayKeyPlayers;

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      containerRef.current.requestFullscreen().catch(() => {});
    }
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen w-full bg-[#0a0914] text-white flex flex-col font-sans selection:bg-purple-600 selection:text-white"
    >
      {/* ── 1. TOP HEADER (EXACT REPLICA OF IMAGE 3) ── */}
      <header className="sticky top-0 z-40 h-[68px] w-full bg-[#121020]/95 backdrop-blur-xl border-b border-white/[0.08] px-4 md:px-6 flex items-center justify-between shadow-lg">
        {/* Left: Tournament Badge & Language Dropdown */}
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 ring-1 ring-amber-300/40">
              <Trophy className="h-4 w-4 text-[#1a1100]" />
            </div>
            <span className="text-xs sm:text-sm font-black tracking-wider text-white uppercase truncate max-w-[150px] sm:max-w-none">
              {tournamentName}
            </span>
          </div>

          {/* Language: English Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsLanguageOpen(!isLanguageOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1b1930] hover:bg-[#252240] border border-white/10 text-xs text-slate-300 font-semibold transition-all cursor-pointer"
            >
              <span className="text-xs">Language:</span>
              <span className="text-sm">🇬🇧</span>
              <span className="font-bold text-white">{selectedLanguage}</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {isLanguageOpen && (
              <div className="absolute left-0 mt-1.5 w-40 rounded-xl bg-[#1b1930] border border-white/15 py-1 shadow-2xl z-50">
                {['English', 'Español', 'Français', 'Deutsch', 'Italiano'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setSelectedLanguage(lang);
                      setIsLanguageOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-1.5 text-xs font-semibold transition-colors hover:bg-purple-600/30 ${
                      selectedLanguage === lang ? 'text-purple-400 font-bold' : 'text-slate-300'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: Image 3 Pill Buttons (Lobby, Grid, Stats, Heart, Calendar, Trophy, Trend) */}
        <nav className="hidden lg:flex items-center gap-1.5 bg-[#17152a] p-1.5 rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveTab('lobby')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'lobby'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Lobby</span>
          </button>

          <button
            onClick={() => setActiveTab('grid')}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            title="Grid View"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            title="Telemetry Graphs"
          >
            <BarChart2 className="h-4 w-4" />
          </button>

          <button
            onClick={() => setIsFavorited(!isFavorited)}
            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
              isFavorited ? 'text-rose-500 bg-rose-500/10' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Favorite Match"
          >
            <Heart className={`h-4 w-4 ${isFavorited ? 'fill-rose-500' : ''}`} />
          </button>

          <button
            onClick={() => router.push('/schedule')}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            title="Schedule & Calendar"
          >
            <Calendar className="h-4 w-4" />
          </button>

          <button
            onClick={() => router.push('/competitions')}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            title="Tournaments & Trophies"
          >
            <Trophy className="h-4 w-4" />
          </button>

          <button
            onClick={() => router.push('/results')}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            title="Trends & Results"
          >
            <TrendingUp className="h-4 w-4" />
          </button>
        </nav>

        {/* Right: Search, Settings, Notifications, User Profile (Image 3) */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => router.push('/explore')}
            className="h-9 w-9 rounded-xl bg-[#1b1930] hover:bg-[#252240] border border-white/5 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Search Fixtures"
          >
            <Search className="h-4 w-4" />
          </button>

          <button
            onClick={() => router.push('/multistream')}
            className="h-9 w-9 rounded-xl bg-[#1b1930] hover:bg-[#252240] border border-white/5 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Multi-Stream Settings"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* Notifications with badge '2' */}
          <div className="relative">
            <button
              className="h-9 w-9 rounded-xl bg-[#1b1930] hover:bg-[#252240] border border-white/5 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center shadow-md">
                2
              </span>
            </button>
          </div>

          {/* User Profile Pill: Miguel Fox */}
          <div className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl bg-[#1b1930] hover:bg-[#252240] border border-white/5 transition-all">
            <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-xs font-black text-white overflow-hidden ring-1 ring-white/20">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="font-bold">MF</span>
              )}
            </div>
            <span className="text-xs font-bold text-slate-200 hidden sm:inline">
              {user?.name || 'Miguel Fox'}
            </span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </div>
        </div>
      </header>

      {/* ── 2. MAIN BROADCAST CANVAS & TACTICAL RAIL (EXACT LAYOUT OF IMAGE 3) ── */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto p-3 sm:p-5 flex flex-col xl:flex-row gap-5">
        {/* Left / Center Area: Live Stream with Floating HUD Overlay */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Main Cinematic Broadcast Container */}
          <div className="relative w-full rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl flex flex-col justify-between min-h-[460px] sm:min-h-[560px] lg:min-h-[620px]">
            {/* Top-Left Floating Header: Back Arrow + "Match Hub" + "🔴 Live" */}
            <div className="absolute top-5 left-5 z-30 flex items-center gap-3 select-none pointer-events-auto">
              <Link
                href="/"
                className="h-9 w-9 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all shadow-xl hover:scale-105"
                title="Return to Match Hub"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
                Match Hub
              </h2>

              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black shadow-lg shadow-red-600/50">
                <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                <span>Live</span>
              </span>
            </div>

            {/* Top-Right Floating Fullscreen Button */}
            <div className="absolute top-5 right-5 z-30 flex items-center gap-2 select-none pointer-events-auto">
              <button
                onClick={toggleFullscreen}
                className="h-9 w-9 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all shadow-xl hover:scale-105 cursor-pointer"
                title="Expand Fullscreen"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>

            {/* Video Stream Layer */}
            <div className="absolute inset-0 w-full h-full bg-black">
              {currentStreamUrl && !errorMsg ? (
                <StreamPlayer
                  streamUrl={currentStreamUrl}
                  channels={currentChannels}
                  matchTitle={match.title}
                  matchStatus={match.status}
                />
              ) : (
                <div 
                  className="w-full h-full bg-cover bg-center flex items-center justify-center relative"
                  style={{
                    backgroundImage: `linear-gradient(to bottom, rgba(13,12,21,0.5), rgba(13,12,21,0.8)), url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1600')`
                  }}
                >
                  <div className="text-center p-6 space-y-2 z-10 max-w-md bg-black/50 backdrop-blur-md rounded-2xl border border-white/10">
                    <RefreshCw className="h-6 w-6 text-purple-400 animate-spin mx-auto mb-2" />
                    <h3 className="text-sm font-black text-white">Live Stadium Broadcast Initializing</h3>
                    <p className="text-xs text-slate-300">
                      Syncing telemetric signal for {hubData.homeName} vs {hubData.awayName}...
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Floating Glass HUD Panels (Image 3) */}
            <div className="relative z-30 mt-auto p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-3.5 pointer-events-auto">
              
              {/* HUD 1: Statistics (Exact green & blue segmented progress bars) */}
              <div className="rounded-2xl bg-black/55 backdrop-blur-xl border border-white/15 p-4 shadow-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2.5">
                    <span className="text-xs font-black uppercase tracking-wider text-white">
                      Statistics
                    </span>

                    {/* Team toggles */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedStatsTeam('home')}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                          selectedStatsTeam === 'home'
                            ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                            : 'bg-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="text-xs">🇵🇹</span>
                        <span>{hubData.homeName.slice(0, 8)}</span>
                      </button>

                      <button
                        onClick={() => setSelectedStatsTeam('away')}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                          selectedStatsTeam === 'away'
                            ? 'bg-blue-500/30 text-blue-300 border border-blue-500/40'
                            : 'bg-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="text-xs">🇨🇴</span>
                        <span>{hubData.awayName.slice(0, 8)}</span>
                      </button>

                      <button className="p-1 text-slate-400 hover:text-white">
                        <Maximize2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* 3 Metric Segmented Bars matching Image 3: Green on left, Blue on right */}
                  <div className="mt-2 space-y-3">
                    {/* Possession: 58% vs 42% */}
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-emerald-400">{hubData.possession.home}%</span>
                        <span className="text-[11px] text-slate-300 font-semibold">Possession</span>
                        <span className="text-blue-400">{hubData.possession.away}%</span>
                      </div>
                      <div className="h-2 w-full bg-[#1c1a2e] rounded-full flex overflow-hidden p-0.5">
                        <div
                          className="bg-[#10b981] h-full rounded-l-full shadow-sm shadow-emerald-500/50"
                          style={{ width: `${hubData.possession.home}%` }}
                        />
                        <div
                          className="bg-[#3b82f6] h-full rounded-r-full shadow-sm shadow-blue-500/50"
                          style={{ width: `${hubData.possession.away}%` }}
                        />
                      </div>
                    </div>

                    {/* Archery / Shots: 48% vs 52% */}
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-emerald-400">{hubData.archery.home}%</span>
                        <span className="text-[11px] text-slate-300 font-semibold">Archery</span>
                        <span className="text-blue-400">{hubData.archery.away}%</span>
                      </div>
                      <div className="h-2 w-full bg-[#1c1a2e] rounded-full flex overflow-hidden p-0.5">
                        <div
                          className="bg-[#10b981] h-full rounded-l-full shadow-sm shadow-emerald-500/50"
                          style={{ width: `${hubData.archery.home}%` }}
                        />
                        <div
                          className="bg-[#3b82f6] h-full rounded-r-full shadow-sm shadow-blue-500/50"
                          style={{ width: `${hubData.archery.away}%` }}
                        />
                      </div>
                    </div>

                    {/* Fouls: 32% vs 68% */}
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-emerald-400">{hubData.fouls.home}%</span>
                        <span className="text-[11px] text-slate-300 font-semibold">Fouls</span>
                        <span className="text-blue-400">{hubData.fouls.away}%</span>
                      </div>
                      <div className="h-2 w-full bg-[#1c1a2e] rounded-full flex overflow-hidden p-0.5">
                        <div
                          className="bg-[#10b981] h-full rounded-l-full shadow-sm shadow-emerald-500/50"
                          style={{ width: `${hubData.fouls.home}%` }}
                        />
                        <div
                          className="bg-[#3b82f6] h-full rounded-r-full shadow-sm shadow-blue-500/50"
                          style={{ width: `${hubData.fouls.away}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* HUD 2: Key players (Exact 3 avatars with red glowing rings) */}
              <div className="rounded-2xl bg-black/55 backdrop-blur-xl border border-white/15 p-4 shadow-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2.5">
                    <span className="text-xs font-black uppercase tracking-wider text-white">
                      Key players
                    </span>

                    {/* Team selector pills */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedKeyPlayerTeam('home')}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                          selectedKeyPlayerTeam === 'home'
                            ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                            : 'bg-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="text-xs">🇵🇹</span>
                        <span>{hubData.homeName.slice(0, 8)}</span>
                      </button>

                      <button
                        onClick={() => setSelectedKeyPlayerTeam('away')}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                          selectedKeyPlayerTeam === 'away'
                            ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                            : 'bg-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="text-xs">🇨🇴</span>
                        <span>{hubData.awayName.slice(0, 8)}</span>
                      </button>

                      <button className="p-1 text-slate-400 hover:text-white">
                        <Maximize2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* 3 Player Avatars */}
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    {activeKeyPlayers.slice(0, 3).map((player) => (
                      <div key={player.id} className="flex flex-col items-center">
                        <div className="relative">
                          {/* Circular Red Glow Ring from Image 3 */}
                          <div className="h-14 w-14 rounded-full p-0.5 bg-gradient-to-tr from-rose-600 to-red-500 shadow-lg shadow-red-600/40 ring-2 ring-red-400/30 overflow-hidden flex items-center justify-center">
                            <img
                              src={player.avatar}
                              alt={player.name}
                              className="h-full w-full object-cover rounded-full"
                            />
                          </div>
                        </div>

                        <span className="text-xs font-black text-white mt-2 truncate w-full">
                          {player.name}
                        </span>
                        <span className="text-[9.5px] text-slate-400 font-medium leading-tight mt-0.5 line-clamp-2">
                          {player.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* HUD 3: Attack zones (Pitch Heatmap with orange glow & legend) */}
              <div className="rounded-2xl bg-black/55 backdrop-blur-xl border border-white/15 p-4 shadow-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-white">
                        Attack zones
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {hubData.attackZones.description}
                      </p>
                    </div>
                    <button className="p-1 text-slate-400 hover:text-white">
                      <Maximize2 className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Soccer Pitch Graphic with Midfield Thermal Glow & Legend */}
                  <div className="mt-3 flex items-center gap-3">
                    {/* Pitch Visualizer */}
                    <div className="relative flex-1 h-24 rounded-xl bg-gradient-to-br from-[#12241b] via-[#0d1a13] to-[#0a140f] border border-emerald-500/30 p-1.5 overflow-hidden">
                      {/* Pitch Lines */}
                      <div className="absolute inset-x-0 top-1/2 h-px bg-emerald-500/25 -translate-y-1/2" />
                      <div className="absolute left-1/2 top-1/2 h-8 w-8 rounded-full border border-emerald-500/25 -translate-x-1/2 -translate-y-1/2" />
                      <div className="absolute top-0 left-1/4 right-1/4 h-3.5 border-b border-l border-r border-emerald-500/25 rounded-b-md" />
                      <div className="absolute bottom-0 left-1/4 right-1/4 h-3.5 border-t border-l border-r border-emerald-500/25 rounded-t-md" />

                      {/* Radial Heatmap Hotspot in Midfield (Image 3) */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-12 bg-gradient-to-r from-amber-500/50 via-rose-500/60 to-red-600/70 rounded-full blur-md animate-pulse pointer-events-none" />
                      <div className="absolute top-1/2 left-[40%] -translate-y-1/2 w-8 h-8 bg-amber-400/60 rounded-full blur-sm pointer-events-none" />
                    </div>

                    {/* Side Legend Breakdown (Image 3) */}
                    <div className="flex flex-col gap-2 shrink-0 text-left">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-blue-900/40 border border-blue-500/40 flex items-center justify-center text-blue-400 text-xs font-bold">
                          ≈
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-medium">Colombia</p>
                          <p className="text-xs font-black text-white">{hubData.attackZones.awayPercentage}%</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-emerald-900/40 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-xs font-bold">
                          ::
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-medium">Portugal</p>
                          <p className="text-xs font-black text-white">{hubData.attackZones.homePercentage}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ── 3. RIGHT TACTICAL MATCH RAIL (EXACT REPLICA OF IMAGE 3) ── */}
        <aside className="w-full xl:w-[380px] flex flex-col gap-4 shrink-0">
          
          {/* CARD 1: Match Scoreboard & Scorers (Image 3) */}
          <div className="rounded-3xl bg-[#131222]/95 backdrop-blur-xl border border-white/10 p-5 shadow-2xl">
            {/* Header: "Match" | Date */}
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Match
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                <Calendar className="h-3 w-3 text-slate-400" />
                <span>{hubData.matchDate}</span>
              </span>
            </div>

            {/* Subheader: Stage & Venue */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium pt-2 pb-3">
              <span>{hubData.stage}</span>
              <span>{hubData.venue}</span>
            </div>

            {/* Scoreboard: Flag Circle | 4 - 2 | Flag Circle */}
            <div className="py-2 flex items-center justify-between px-2">
              {/* Home Team (Portugal) */}
              <div className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-full p-1 bg-white/10 border border-white/20 flex items-center justify-center shadow-lg">
                  <img
                    src={hubData.homeBadge}
                    alt={hubData.homeName}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                </div>
              </div>

              {/* Big Score: 4 - 2 */}
              <div className="text-3xl sm:text-4xl font-black text-white tracking-wider tabular-nums flex items-center gap-2">
                <span>{match.homeScore ?? 4}</span>
                <span className="text-slate-500 font-light">-</span>
                <span>{match.awayScore ?? 2}</span>
              </div>

              {/* Away Team (Colombia) */}
              <div className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-full p-1 bg-white/10 border border-white/20 flex items-center justify-center shadow-lg">
                  <img
                    src={hubData.awayBadge}
                    alt={hubData.awayName}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Scorers List: Ronaldo 58' 60', Felix 23' 40' vs Diaz 25', Arias 55' */}
            <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-2 gap-3 text-xs">
              {/* Home Scorers */}
              <div className="space-y-1 text-left">
                {hubData.homeScorersList.map((s, idx) => (
                  <p key={idx} className="text-slate-200 font-bold">
                    <span>{s.player} </span>
                    <span className="text-slate-400 font-medium">{s.minutes}</span>
                  </p>
                ))}
              </div>

              {/* Away Scorers */}
              <div className="space-y-1 text-right">
                {hubData.awayScorersList.map((s, idx) => (
                  <p key={idx} className="text-slate-200 font-bold flex items-center justify-end gap-1">
                    <span>{s.player} </span>
                    <span className="text-slate-400 font-medium">{s.minutes}</span>
                    {s.card === 'yellow' && (
                      <span className="inline-block w-2.5 h-3.5 bg-amber-400 rounded-sm ml-0.5 shadow-sm" />
                    )}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* CARD 2: "The best player of the match" (Cristiano Ronaldo Crimson Card - Image 3) */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#e11d48] via-[#dc2626] to-[#991b1b] p-5 shadow-2xl shadow-red-600/30 text-white min-h-[220px] flex flex-col justify-between">
            {/* Giant Semi-Transparent Watermark Number '7' in Background (Image 3) */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[140px] font-black text-white/15 select-none pointer-events-none leading-none">
              {hubData.bestPlayer.jersey}
            </div>

            {/* Card Header: "The best player of the match" & Top-Right Stats */}
            <div className="relative z-10 flex items-start justify-between">
              <span className="text-xs font-semibold text-white/90">
                The best player of the match
              </span>

              {/* Goals x2 & Attendance x2 */}
              <div className="flex flex-col gap-1 text-right text-xs font-black">
                <div className="bg-black/25 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10">
                  <span className="text-[10px] text-white/70 block leading-tight">Goals</span>
                  <span className="text-sm">x{hubData.bestPlayer.goals}</span>
                </div>
                <div className="bg-black/25 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10">
                  <span className="text-[10px] text-white/70 block leading-tight">Attendance</span>
                  <span className="text-sm">x{hubData.bestPlayer.assists}</span>
                </div>
              </div>
            </div>

            {/* Player Cutout Portrait (Image 3) */}
            <div className="absolute left-6 bottom-4 z-10 flex items-end">
              <div className="h-32 w-32 rounded-2xl overflow-hidden ring-2 ring-white/30 shadow-2xl bg-black/20">
                <img
                  src={hubData.bestPlayer.avatar}
                  alt={hubData.bestPlayer.name}
                  className="h-full w-full object-cover object-top"
                />
              </div>
            </div>

            {/* Bottom Player Name & Team Crest (Image 3) */}
            <div className="relative z-10 pl-36 pt-12 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                  {hubData.bestPlayer.name}
                </h3>
              </div>

              {/* Portugal Federation Crest */}
              <div className="h-8 w-8 rounded-full bg-white/20 p-1 flex items-center justify-center shrink-0">
                <img
                  src={hubData.bestPlayer.teamBadge}
                  alt=""
                  className="h-6 w-6 object-contain"
                />
              </div>
            </div>
          </div>

          {/* CARD 3: Match Minute Scrubber (Image 3: ⏱ 60:00 & 40-80 timeline) */}
          <div className="rounded-3xl bg-[#131222]/95 backdrop-blur-xl border border-white/10 p-5 shadow-2xl">
            {/* Center Clock: ⏱ 60:00 */}
            <div className="flex items-center justify-center mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-black text-white tracking-wider">
                <span>⏱</span>
                <span>60:00</span>
              </span>
            </div>

            {/* Timeline Tick Scrubber: 40, 50, 60, 70, 80 */}
            <div className="px-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-2">
                <span>40</span>
                <span>50</span>
                <span className="text-white font-extrabold">60</span>
                <span>70</span>
                <span>80</span>
              </div>

              {/* Scrubber Bar */}
              <div className="relative h-2 w-full bg-[#1e1c32] rounded-full overflow-visible">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                  style={{ width: '50%' }}
                />

                {/* Scrubber Knob */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-white shadow-lg ring-2 ring-purple-500" />
              </div>

              {/* Events below scrubber: Yellow card Diaz & Goal */}
              <div className="mt-3 flex items-center justify-between text-xs px-2">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-3.5 bg-amber-400 rounded-sm inline-block shadow-sm" />
                  <span className="text-[11px] font-bold">Diaz</span>
                </div>

                <div className="flex items-center gap-1 text-slate-300">
                  <span className="text-sm">⚽</span>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 4: Bottom AI Insight Pill with Glowing Orb (Image 3) */}
          {showAiInsight && (
            <div className="rounded-2xl bg-[#141224] border border-white/10 p-3.5 shadow-2xl flex items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-3 min-w-0">
                {/* Glowing Multi-Color Orb from Image 3 */}
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-500 to-pink-500 p-0.5 shadow-lg shadow-pink-500/30 flex items-center justify-center shrink-0 animate-pulse">
                  <div className="h-full w-full rounded-full bg-[#141224] flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-pink-400" />
                  </div>
                </div>

                <p className="text-xs text-slate-200 font-semibold leading-snug">
                  Goals in the second half have increased by <span className="text-emerald-400 font-extrabold">34%</span>.
                </p>
              </div>

              <button
                onClick={() => setShowAiInsight(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

        </aside>
      </main>
    </div>
  );
}
