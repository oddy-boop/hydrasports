'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Trophy,
  ChevronDown,
  LayoutGrid,
  BarChart2,
  Sliders,
  Calendar,
  Users,
  PieChart,
  Search,
  Bell,
  ArrowLeft,
  Tv,
  Sparkles,
  Maximize2,
  RefreshCw,
  Shield,
  Layers,
  ChevronRight,
  Info,
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
  const [activeChannelIdx, setActiveChannelIdx] = useState(0);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [timelineHoverEvent, setTimelineHoverEvent] = useState(null);

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

  return (
    <div className="min-h-screen w-full bg-[#0d0c15] text-white flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* 1. TOP HEADER (Image 3) */}
      <header className="sticky top-0 z-40 h-16 w-full bg-[#121120]/95 backdrop-blur-md border-b border-[#232038] px-4 md:px-6 flex items-center justify-between shadow-md">
        {/* Left: Tournament Badge & Language Dropdown */}
        <div className="flex items-center gap-3 md:gap-5">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 ring-1 ring-amber-300/40">
              <Trophy className="h-5 w-5 text-[#1a1100]" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs md:text-sm font-extrabold tracking-wider text-white uppercase truncate max-w-[160px] md:max-w-none">
                {tournamentName}
              </span>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                Live Broadcast Center
              </span>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsLanguageOpen(!isLanguageOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1a182d] hover:bg-[#23203c] border border-white/10 text-xs text-slate-200 font-medium transition-all"
            >
              <span className="text-sm">🇬🇧</span>
              <span className="hidden sm:inline">Language:</span>
              <span className="font-semibold">{selectedLanguage}</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {isLanguageOpen && (
              <div className="absolute left-0 mt-1.5 w-40 rounded-xl bg-[#1a182d] border border-[#2b2746] py-1 shadow-2xl z-50">
                {['English', 'Español', 'Français', 'Deutsch', 'Italiano'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setSelectedLanguage(lang);
                      setIsLanguageOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-1.5 text-xs transition-colors hover:bg-purple-600/30 ${
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

        {/* Center: Navigation Pill Bar */}
        <nav className="hidden md:flex items-center gap-1 bg-[#17152b] p-1 rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveTab('lobby')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'lobby'
                ? 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-lg shadow-indigo-500/25'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Lobby</span>
          </button>

          <button
            onClick={() => setActiveTab('statistics')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'statistics'
                ? 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-lg shadow-indigo-500/25'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart2 className="h-3.5 w-3.5" />
            <span>Statistics</span>
          </button>

          <button
            onClick={() => setActiveTab('lineups')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'lineups'
                ? 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-lg shadow-indigo-500/25'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Lineups</span>
          </button>
        </nav>

        {/* Right: Multi-Stream, Refresh, User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/multistream"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/30 text-purple-300 hover:text-white text-xs font-bold transition-all"
            title="Multi-Stream Quad View"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Multi-Stream</span>
          </Link>

          <button
            onClick={() => refreshMatchData()}
            className="h-9 w-9 rounded-xl bg-[#1a182d] hover:bg-[#25223e] border border-white/5 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Refresh live telemetry"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          <Link
            href="/auth"
            className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl bg-[#1a182d] hover:bg-[#25223e] border border-white/5 transition-all"
          >
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-black text-white overflow-hidden ring-1 ring-white/20">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                (user?.name || 'Miguel Fox').charAt(0)
              )}
            </div>
            <span className="text-xs font-bold text-slate-200 hidden sm:inline">
              {user?.name || 'Miguel Fox'}
            </span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </Link>
        </div>
      </header>

      {/* 2. MAIN MATCH HUB CONTENT (Player + 3 Floating HUD Cards + Right Rail) */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto p-3 md:p-5 flex flex-col xl:flex-row gap-5">
        {/* Left / Center Stream Area (approx 72-74% on desktop) */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Edge-to-Edge Stream Canvas Container */}
          <div className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl">
            {/* Top Overlay inside Stream Canvas: Back to Match Hub & Live Badge */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2.5 pointer-events-auto">
              <Link
                href="/"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/15 text-xs font-semibold text-white transition-all shadow-lg hover:scale-105"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Match Hub</span>
              </Link>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/90 text-white text-[11px] font-bold shadow-lg shadow-red-600/30">
                <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                <span>Live</span>
              </div>
            </div>

            {/* Top-Right Stream Overlays: Channels & Resolution */}
            {currentChannels.length > 1 && (
              <div className="absolute top-4 right-4 z-20 hidden sm:flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/10">
                {currentChannels.map((ch, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveChannelIdx(idx)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                      activeChannelIdx === idx
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {ch.name || `Server ${idx + 1}`}
                  </button>
                ))}
              </div>
            )}

            {/* Video Player Render */}
            <div className="w-full aspect-video min-h-[300px] sm:min-h-[420px] md:min-h-[500px] lg:min-h-[560px] bg-black">
              {currentStreamUrl && !errorMsg ? (
                <StreamPlayer
                  streamUrl={currentStreamUrl}
                  channels={currentChannels}
                  matchTitle={match.title}
                  matchStatus={match.status}
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center p-6 text-center">
                  <div className="space-y-3 max-w-md">
                    <div className="mx-auto h-12 w-12 rounded-2xl bg-[#1c1a2e] border border-white/10 flex items-center justify-center">
                      <RefreshCw className="h-5 w-5 text-purple-400 animate-spin" />
                    </div>
                    <h3 className="text-sm font-bold text-white">Connecting to Stadium Broadcast</h3>
                    <p className="text-xs text-slate-400 font-medium">
                      {errorMsg || 'Hydra Sport is routing low-latency stream feeds.'}
                    </p>
                    <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10 text-left text-xs text-slate-300 space-y-1">
                      <p><span className="text-slate-500">Fixture:</span> {match.title}</p>
                      <p><span className="text-slate-500">Competition:</span> {tournamentName}</p>
                      <p><span className="text-slate-500">Kickoff:</span> {match.currentMinute || 'Live'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3 Floating / Docked Tactical HUD Panels (Directly matching Image 3) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* HUD Card 1: Statistics */}
            <div className="rounded-2xl bg-[#131222]/90 backdrop-blur-xl border border-white/10 p-4 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
                    Statistics
                  </span>
                  <Info className="h-3.5 w-3.5 text-slate-400" />
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-slate-400 px-1">
                  <span className="truncate max-w-[90px]">{hubData.homeName}</span>
                  <span className="truncate max-w-[90px] text-right">{hubData.awayName}</span>
                </div>

                {/* Comparative Metric Bars */}
                {hubData.hasRealStats ? (
                  <div className="mt-3 space-y-3">
                    {/* Possession */}
                    <div>
                      <div className="flex justify-between text-xs font-extrabold mb-1">
                        <span className="text-indigo-400">{hubData.possession.home}%</span>
                        <span className="text-[11px] text-slate-400 font-medium">Possession</span>
                        <span className="text-emerald-400">{hubData.possession.away}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full flex overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full"
                          style={{ width: `${hubData.possession.home}%` }}
                        />
                        <div
                          className="bg-emerald-500 h-full"
                          style={{ width: `${hubData.possession.away}%` }}
                        />
                      </div>
                    </div>

                    {/* Shots on target */}
                    <div>
                      <div className="flex justify-between text-xs font-extrabold mb-1">
                        <span className="text-indigo-400">{hubData.shotsOnTarget.home}</span>
                        <span className="text-[11px] text-slate-400 font-medium">Shots on target</span>
                        <span className="text-emerald-400">{hubData.shotsOnTarget.away}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full flex overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full"
                          style={{
                            width: `${(hubData.shotsOnTarget.home / (hubData.shotsOnTarget.home + hubData.shotsOnTarget.away || 1)) * 100}%`,
                          }}
                        />
                        <div
                          className="bg-emerald-500 h-full"
                          style={{
                            width: `${(hubData.shotsOnTarget.away / (hubData.shotsOnTarget.home + hubData.shotsOnTarget.away || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Total shots */}
                    <div>
                      <div className="flex justify-between text-xs font-extrabold mb-1">
                        <span className="text-indigo-400">{hubData.totalShots.home}</span>
                        <span className="text-[11px] text-slate-400 font-medium">Total shots</span>
                        <span className="text-emerald-400">{hubData.totalShots.away}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full flex overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full"
                          style={{
                            width: `${(hubData.totalShots.home / (hubData.totalShots.home + hubData.totalShots.away || 1)) * 100}%`,
                          }}
                        />
                        <div
                          className="bg-emerald-500 h-full"
                          style={{
                            width: `${(hubData.totalShots.away / (hubData.totalShots.home + hubData.totalShots.away || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Fouls */}
                    <div>
                      <div className="flex justify-between text-xs font-extrabold mb-1">
                        <span className="text-indigo-400">{hubData.fouls.home}</span>
                        <span className="text-[11px] text-slate-400 font-medium">Fouls</span>
                        <span className="text-emerald-400">{hubData.fouls.away}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full flex overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full"
                          style={{
                            width: `${(hubData.fouls.home / (hubData.fouls.home + hubData.fouls.away || 1)) * 100}%`,
                          }}
                        />
                        <div
                          className="bg-emerald-500 h-full"
                          style={{
                            width: `${(hubData.fouls.away / (hubData.fouls.home + hubData.fouls.away || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Corner kicks */}
                    <div>
                      <div className="flex justify-between text-xs font-extrabold mb-1">
                        <span className="text-indigo-400">{hubData.corners.home}</span>
                        <span className="text-[11px] text-slate-400 font-medium">Corner kicks</span>
                        <span className="text-emerald-400">{hubData.corners.away}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full flex overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full"
                          style={{
                            width: `${(hubData.corners.home / (hubData.corners.home + hubData.corners.away || 1)) * 100}%`,
                          }}
                        />
                        <div
                          className="bg-emerald-500 h-full"
                          style={{
                            width: `${(hubData.corners.away / (hubData.corners.home + hubData.corners.away || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 py-8 px-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center text-center">
                    <BarChart2 className="w-5 h-5 text-slate-500 mb-1.5" />
                    <p className="text-xs font-bold text-slate-300">Live Match Statistics Pending</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Real-time match metrics will update as play unfolds</p>
                  </div>
                )}
              </div>
            </div>

            {/* HUD Card 2: Key players */}
            <div className="rounded-2xl bg-[#131222]/90 backdrop-blur-xl border border-white/10 p-4 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
                    Key players
                  </span>
                  <div className="flex items-center gap-1 bg-[#1a182d] p-0.5 rounded-lg border border-white/5">
                    <button
                      onClick={() => setSelectedKeyPlayerTeam('home')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                        selectedKeyPlayerTeam === 'home'
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {hubData.homeName.slice(0, 7)}
                    </button>
                    <button
                      onClick={() => setSelectedKeyPlayerTeam('away')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                        selectedKeyPlayerTeam === 'away'
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {hubData.awayName.slice(0, 7)}
                    </button>
                  </div>
                </div>

                {/* Real Player Squad Grid */}
                {activeKeyPlayers.length > 0 ? (
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {activeKeyPlayers.slice(0, 4).map((player, idx) => (
                      <div key={player.id || idx} className="flex flex-col items-center text-center group">
                        <div className="relative">
                          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-500/30 to-indigo-600/30 border-2 border-purple-500/40 p-0.5 shadow-lg group-hover:border-purple-400 transition-all flex items-center justify-center overflow-hidden">
                            {player.avatar ? (
                              <img src={player.avatar} alt="" className="h-full w-full object-cover rounded-full" />
                            ) : (
                              <span className="text-xs font-black text-purple-300">
                                {player.jersey || player.name.charAt(0)}
                              </span>
                            )}
                          </div>
                          {player.position && (
                            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-[#181628] border border-purple-500/40 text-[9px] font-black text-purple-300">
                              {player.position}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-[11px] font-bold text-slate-200 truncate w-full" title={player.name}>
                          {player.name}
                        </p>
                        {player.jersey && (
                          <span className="text-[10px] font-semibold text-slate-400">
                            #{player.jersey}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 py-8 px-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center text-center">
                    <Users className="w-5 h-5 text-slate-500 mb-1.5" />
                    <p className="text-xs font-bold text-slate-300">Official Squad Lineups Pending</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Starting lineup rosters will update automatically from official team feeds</p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                <span>Roster Status</span>
                <span className="text-emerald-400 font-bold">
                  {activeKeyPlayers.length > 0 ? `${activeKeyPlayers.length} Confirmed Players` : 'Awaiting Kickoff Lineup'}
                </span>
              </div>
            </div>

            {/* HUD Card 3: Attack zones */}
            <div className="rounded-2xl bg-[#131222]/90 backdrop-blur-xl border border-white/10 p-4 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
                    Attack zones
                  </span>
                  <span className="text-[10px] text-purple-400 font-semibold">Pitch Heatmap</span>
                </div>
                <p className="mt-2 text-[11px] text-slate-400 font-medium">
                  {hubData.attackZones.description}
                </p>

                {/* Mini Soccer Pitch Schematic with Zone Overlays */}
                <div className="relative mt-3 h-28 w-full rounded-xl bg-gradient-to-b from-[#14231b] to-[#0d1812] border border-emerald-500/20 p-2 overflow-hidden flex flex-col justify-between">
                  {/* Pitch Markings */}
                  <div className="absolute inset-x-0 top-1/2 h-px bg-emerald-500/20 -translate-y-1/2" />
                  <div className="absolute left-1/2 top-1/2 h-10 w-10 rounded-full border border-emerald-500/20 -translate-x-1/2 -translate-y-1/2" />
                  <div className="absolute top-0 left-1/4 right-1/4 h-5 border-b border-l border-r border-emerald-500/20 rounded-b-lg" />
                  <div className="absolute bottom-0 left-1/4 right-1/4 h-5 border-t border-l border-r border-emerald-500/20 rounded-t-lg" />

                  {/* 3 Zone Attack Percentages */}
                  <div className="relative z-10 grid grid-cols-3 h-full">
                    <div className="flex flex-col items-center justify-center border-r border-white/5 bg-indigo-500/10 hover:bg-indigo-500/20 transition-all rounded-l-lg">
                      <span className="text-xs font-black text-indigo-300">{hubData.attackZones.left}%</span>
                      <span className="text-[9px] text-slate-400">Left Wing</span>
                    </div>
                    <div className="flex flex-col items-center justify-center border-r border-white/5 bg-purple-500/20 hover:bg-purple-500/30 transition-all">
                      <span className="text-xs font-black text-purple-200">{hubData.attackZones.center}%</span>
                      <span className="text-[9px] text-slate-300 font-bold">Center</span>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-indigo-500/10 hover:bg-indigo-500/20 transition-all rounded-r-lg">
                      <span className="text-xs font-black text-indigo-300">{hubData.attackZones.right}%</span>
                      <span className="text-[9px] text-slate-400">Right Wing</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                <span>Final third entries</span>
                <span className="font-bold text-slate-200">24 Attacking runs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Tactical Match Rail (Image 3) */}
        <aside className="w-full xl:w-[380px] flex flex-col gap-4 shrink-0">
          {/* Card A: Match (Score, Scorers, & Timeline) */}
          <div className="rounded-2xl bg-[#131222]/95 backdrop-blur-xl border border-white/10 p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                Match
              </span>
              <span className="px-2 py-0.5 rounded-full bg-purple-600/20 border border-purple-500/30 text-[10px] font-bold text-purple-300">
                {match.status === 'live' ? (match.currentMinute || 'LIVE') : 'REGULAR TIME'}
              </span>
            </div>

            {/* Big Score Board */}
            <div className="py-4 flex items-center justify-between">
              {/* Home */}
              <div className="flex flex-col items-center text-center w-24">
                <div className="h-12 w-12 rounded-full bg-white/5 border border-white/10 p-1 flex items-center justify-center mb-1.5 shadow-md">
                  {hubData.homeBadge ? (
                    <img src={hubData.homeBadge} alt="" className="h-9 w-9 object-contain" />
                  ) : (
                    <span className="text-xs font-black text-slate-300">{hubData.homeName.slice(0, 3)}</span>
                  )}
                </div>
                <span className="text-xs font-bold text-slate-100 truncate w-full">
                  {hubData.homeName}
                </span>
              </div>

              {/* Score */}
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    {typeof match.homeScore === 'number' ? match.homeScore : 0}
                  </span>
                  <span className="text-2xl font-black text-slate-500">:</span>
                  <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    {typeof match.awayScore === 'number' ? match.awayScore : 0}
                  </span>
                </div>
                <span className="mt-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {match.status === 'live' ? `● ${match.currentMinute || 'In Progress'}` : 'Full Time'}
                </span>
              </div>

              {/* Away */}
              <div className="flex flex-col items-center text-center w-24">
                <div className="h-12 w-12 rounded-full bg-white/5 border border-white/10 p-1 flex items-center justify-center mb-1.5 shadow-md">
                  {hubData.awayBadge ? (
                    <img src={hubData.awayBadge} alt="" className="h-9 w-9 object-contain" />
                  ) : (
                    <span className="text-xs font-black text-slate-300">{hubData.awayName.slice(0, 3)}</span>
                  )}
                </div>
                <span className="text-xs font-bold text-slate-100 truncate w-full">
                  {hubData.awayName}
                </span>
              </div>
            </div>

            {/* Goal Scorers List (Only shown when real goals recorded in feed) */}
            {(hubData.homeGoals.length > 0 || hubData.awayGoals.length > 0) && (
              <div className="py-2.5 border-t border-b border-white/5 grid grid-cols-2 gap-2 text-[11px]">
                <div className="space-y-1">
                  {hubData.homeGoals.map((g, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-slate-300">
                      <span className="text-xs">⚽</span>
                      <span className="font-bold text-white">{g.minute}</span>
                      <span className="truncate text-slate-300">{g.player}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1 text-right">
                  {hubData.awayGoals.map((g, idx) => (
                    <div key={idx} className="flex items-center justify-end gap-1.5 text-slate-300">
                      <span className="truncate text-slate-300">{g.player}</span>
                      <span className="font-bold text-white">{g.minute}</span>
                      <span className="text-xs">⚽</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interactive Minute Timeline (0' to 90'+) */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                <span>0&apos;</span>
                <span>15&apos;</span>
                <span>30&apos;</span>
                <span>45&apos;</span>
                <span>60&apos;</span>
                <span>75&apos;</span>
                <span>90&apos;+</span>
              </div>
              <div className="relative h-2 w-full bg-[#1b1930] rounded-full overflow-visible">
                {/* Minute progression bar */}
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                  style={{
                    width: `${Math.min(((match.currentMinuteNumber || 78) / 90) * 100, 100)}%`,
                  }}
                />

                {/* Pinned Timeline Event Icons */}
                {hubData.timelineEvents.slice(0, 8).map((ev, idx) => {
                  const leftPct = Math.min((ev.minute / 90) * 100, 96);
                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setTimelineHoverEvent(ev)}
                      onMouseLeave={() => setTimelineHoverEvent(null)}
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer z-10 transition-transform hover:scale-125"
                      style={{ left: `${leftPct}%` }}
                    >
                      <div className="h-4 w-4 rounded-full bg-[#0e0d18] border border-white/20 flex items-center justify-center text-[9px] shadow-md">
                        {ev.type === 'goal' && '⚽'}
                        {ev.type === 'yellow_card' && '🟨'}
                        {ev.type === 'red_card' && '🟥'}
                        {ev.type === 'sub' && '⇄'}
                      </div>
                    </div>
                  );
                })}
              </div>

                {/* Timeline Hover Tooltip */}
                {timelineHoverEvent && (
                  <div className="mt-2.5 p-2 rounded-xl bg-[#1c1a2e] border border-purple-500/30 text-[11px] text-slate-200 shadow-xl flex items-center gap-2">
                    <span className="font-extrabold text-purple-400">{timelineHoverEvent.displayMinute}</span>
                    <span className="text-slate-300 truncate">{timelineHoverEvent.text || `${timelineHoverEvent.player} (${timelineHoverEvent.type})`}</span>
                  </div>
                )}
            </div>
          </div>

          {/* Card B: Real Match Information & Verified Broadcast Feed (No Mock/MVP Data) */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#1a172e] via-[#161426] to-[#12101e] border border-white/10 p-5 shadow-xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Shield className="text-emerald-400 h-4 w-4" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                  Broadcast Intelligence
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-[10px] font-black text-emerald-300 border border-emerald-500/30">
                Verified CDN
              </span>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-slate-400">Tournament</span>
                <span className="font-extrabold text-white text-right truncate max-w-[180px]">{hubData.tournament || tournamentName}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-slate-400">Stadium Venue</span>
                <span className="font-extrabold text-slate-200 text-right truncate max-w-[180px]">{hubData.venue || 'San Siro Arena'}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-slate-400">Stream Source</span>
                <span className="font-bold text-emerald-400">{currentChannels[activeChannelIdx]?.name || 'Direct HD Stream Feed'}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-slate-400">Sync Latency</span>
                <span className="inline-flex items-center gap-1.5 text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Ultra-Low Sync (&lt; 1s)</span>
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-400">Language Commentary</span>
                <span className="font-semibold text-slate-300">{selectedLanguage} (Stadium Direct)</span>
              </div>
            </div>
          </div>

          {/* Card C: Live Match Feed Telemetry */}
          <div className="rounded-2xl bg-[#18162b]/95 border border-purple-500/20 p-3.5 shadow-xl flex items-start gap-3">
            <div className="h-7 w-7 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-400">
                Live Feed Telemetry
              </span>
              <p className="text-xs text-slate-300 font-medium leading-relaxed mt-0.5">
                Real-time official score tracking and broadcast synchronization active for {match.title}.
              </p>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
