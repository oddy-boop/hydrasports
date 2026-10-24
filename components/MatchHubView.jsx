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
  Shield,
  Activity,
  Award,
  Layers,
  ArrowRightLeft,
  AlertTriangle,
  Flame,
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
  const [tacticalTab, setTacticalTab] = useState('lineups'); // 'lineups' | 'subs' | 'discipline' | 'stats' | 'zones'
  const [selectedTeamTab, setSelectedTeamTab] = useState('home'); // 'home' | 'away'
  const [activeChannelIdx, setActiveChannelIdx] = useState(0);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [showAiInsight, setShowAiInsight] = useState(true);
  const containerRef = useRef(null);

  // Parse all HUD and tactical telemetry dynamically (ZERO MOCK DATA)
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

  const tournamentName = (match.tournament || hubData.tournament || 'Match Broadcast').toUpperCase();
  const currentChannels = channels.length > 0 ? channels : [{ name: 'Server 1', url: streamUrl, proxiedUrl: streamUrl }];
  const currentStreamUrl = currentChannels[activeChannelIdx]?.proxiedUrl || currentChannels[activeChannelIdx]?.url || streamUrl;

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      containerRef.current.requestFullscreen().catch(() => {});
    }
  };

  const currentStarters = selectedTeamTab === 'home' ? hubData.lineups.home : hubData.lineups.away;
  const currentSubstitutes = selectedTeamTab === 'home' ? hubData.substitutes.home : hubData.substitutes.away;
  const currentFormation = selectedTeamTab === 'home' ? hubData.formations.home : hubData.formations.away;
  const currentTeamName = selectedTeamTab === 'home' ? hubData.homeName : hubData.awayName;
  const currentTeamBadge = selectedTeamTab === 'home' ? hubData.homeBadge : hubData.awayBadge;

  // Real player face fetching
  const [playerFaces, setPlayerFaces] = useState({});

  useEffect(() => {
    const candidateNames = [
      ...currentStarters.map(p => p.name),
      hubData.bestPlayer?.name,
      ...(hubData.lineups?.home || []).map(p => p.name),
      ...(hubData.lineups?.away || []).map(p => p.name),
    ].filter(Boolean);

    const uniqueNames = Array.from(new Set(candidateNames));
    if (uniqueNames.length === 0) return;

    fetch(`/api/player-face?names=${encodeURIComponent(uniqueNames.join(','))}`)
      .then(res => res.json())
      .then(data => {
        if (data.faces) {
          setPlayerFaces(prev => ({ ...prev, ...data.faces }));
        }
      })
      .catch(() => {});
  }, [currentStarters, hubData.bestPlayer?.name]);

  // Helper to determine tactical depth (tier) and horizontal lateral position (x)
  const getPlayerRoleScore = (p) => {
    // 1. Explicit formationPlace from standard soccer lineup numbering (FIFA/ESPN)
    // 1: GK
    // 3: LB (-2), 6: CB-L (-1), 5: CB-R (1), 2: RB (2)
    // 4: DM-L / LM (-1), 8: DM-R / RM (1)
    // 11: AM-L / LW (-2), 10: AM / CAM (0), 7: AM-R / RW (2)
    // 9: ST / CF (0)
    const place = p.formationPlace;
    if (typeof place === 'number' && place >= 1 && place <= 11) {
      if (place === 1) return { tier: 0, x: 0 };
      if (place === 3) return { tier: 1, x: -2 };
      if (place === 6) return { tier: 1, x: -1 };
      if (place === 5) return { tier: 1, x: 1 };
      if (place === 2) return { tier: 1, x: 2 };
      if (place === 4) return { tier: 2, x: -1 };
      if (place === 8) return { tier: 2, x: 1 };
      if (place === 11) return { tier: 3, x: -2 };
      if (place === 10) return { tier: 3, x: 0 };
      if (place === 7) return { tier: 3, x: 2 };
      if (place === 9) return { tier: 4, x: 0 };
    }

    const pos = (p.position || '').toUpperCase().trim();
    const grp = (p.positionGroup || '').toUpperCase().trim();
    const text = `${pos} ${grp}`;

    // GK
    if (grp === 'GK' || pos === 'G' || pos === 'GK' || text.includes('GOAL')) {
      return { tier: 0, x: 0 };
    }

    // Horizontal position X (-2: Left, -1: Center-Left, 0: Center, 1: Center-Right, 2: Right)
    let x = 0;
    if (
      text.includes('LEFT') || pos.endsWith('-L') || pos.startsWith('L') ||
      pos === 'LB' || pos === 'LWB' || pos === 'LM' || pos === 'LW' || pos === 'AML' || pos === 'LCB'
    ) {
      x = (pos === 'LB' || pos === 'LWB' || pos === 'LW' || text.includes('LEFT BACK') || text.includes('LEFT WING')) ? -2 : -1;
    } else if (
      text.includes('RIGHT') || pos.endsWith('-R') || pos.startsWith('R') ||
      pos === 'RB' || pos === 'RWB' || pos === 'RM' || pos === 'RW' || pos === 'AMR' || pos === 'RCB'
    ) {
      x = (pos === 'RB' || pos === 'RWB' || pos === 'RW' || text.includes('RIGHT BACK') || text.includes('RIGHT WING')) ? 2 : 1;
    }

    // Vertical Tier:
    // 1: Defenders
    // 2: Defensive / Holding / Deep Midfielders
    // 3: Attacking Midfielders / Wingers
    // 4: Strikers / Forwards
    let tier = 1;
    if (grp === 'DF' || text.includes('DEF') || text.includes('BACK') || pos === 'CB' || pos === 'LB' || pos === 'RB' || pos.startsWith('CD')) {
      tier = 1;
    } else if (grp === 'FW' || pos === 'F' || pos === 'ST' || pos === 'CF' || text.includes('FORWARD') || text.includes('STRIKER')) {
      tier = 4;
    } else if (
      text.includes('ATTACKING') || pos.startsWith('AM') || pos === 'LW' || pos === 'RW' ||
      pos === 'CAM' || pos === 'AML' || pos === 'AMR'
    ) {
      tier = 3;
    } else {
      tier = 2; // Central/defensive midfielders (DM, CM, LM, RM)
    }

    return { tier, x };
  };

  // Dynamic tactical formation rows (e.g. 4-2-3-1, 4-3-3, 3-5-2)
  const getFormationRows = (formationStr, starters) => {
    if (!starters || starters.length === 0) return { gk: [], outfieldRows: [] };

    // Identify Goalkeeper
    const gkMatches = starters.filter(p => getPlayerRoleScore(p).tier === 0);
    const actualGk = gkMatches.length > 0 ? gkMatches.slice(0, 1) : starters.slice(0, 1);
    const outfield = starters.filter(p => p !== actualGk[0]).slice(0, 10);

    const nums = (formationStr || '').match(/\d+/g)?.map(Number) || [];
    const sum = nums.reduce((a, b) => a + b, 0);

    // Sort outfield strictly by vertical tier (Defenders -> Midfielders -> Attackers)
    // and horizontally left-to-right within each tier
    const sortedOutfield = [...outfield].sort((a, b) => {
      const sa = getPlayerRoleScore(a);
      const sb = getPlayerRoleScore(b);
      if (sa.tier !== sb.tier) return sa.tier - sb.tier;
      return sa.x - sb.x;
    });

    if (sum === 10 && nums.length >= 2) {
      let offset = 0;
      const rows = [];
      for (const count of nums) {
        const rowPlayers = sortedOutfield.slice(offset, offset + count);
        // Ensure within each row, players are arranged strictly Left to Right
        rowPlayers.sort((a, b) => getPlayerRoleScore(a).x - getPlayerRoleScore(b).x);
        rows.push(rowPlayers);
        offset += count;
      }
      return {
        gk: actualGk,
        outfieldRows: [...rows].reverse(), // Top row = Attackers (e.g. Striker), bottom row = Defenders
      };
    }

    // Default 4-3-3 fallback
    const dfRow = sortedOutfield.slice(0, 4).sort((a, b) => getPlayerRoleScore(a).x - getPlayerRoleScore(b).x);
    const mfRow = sortedOutfield.slice(4, 7).sort((a, b) => getPlayerRoleScore(a).x - getPlayerRoleScore(b).x);
    const fwRow = sortedOutfield.slice(7, 10).sort((a, b) => getPlayerRoleScore(a).x - getPlayerRoleScore(b).x);

    return {
      gk: actualGk,
      outfieldRows: [fwRow, mfRow, dfRow],
    };
  };

  const { gk, outfieldRows } = getFormationRows(currentFormation, currentStarters);
  const gkList = currentStarters.filter(p => p.positionGroup === 'GK');
  const dfList = currentStarters.filter(p => p.positionGroup === 'DF');
  const mfList = currentStarters.filter(p => p.positionGroup === 'MF');
  const fwList = currentStarters.filter(p => p.positionGroup === 'FW');

  return (
    <div 
      ref={containerRef}
      className="min-h-screen w-full bg-[#0a0914] text-white flex flex-col font-sans selection:bg-purple-600 selection:text-white"
    >
      {/* ── 1. TOP HEADER ── */}
      <header className="sticky top-0 z-40 h-[68px] w-full bg-[#121020]/95 backdrop-blur-xl border-b border-white/[0.08] px-4 md:px-6 flex items-center justify-between shadow-lg">
        {/* Left: Tournament Badge & Return link */}
        <div className="flex items-center gap-3 sm:gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold border border-white/10 transition-all group"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 text-purple-400 transition-transform" />
            <span className="hidden sm:inline">Hub</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 ring-1 ring-amber-300/40">
              <Trophy className="h-4 w-4 text-[#1a1100]" />
            </div>
            <span className="text-xs sm:text-sm font-black tracking-wider text-white uppercase truncate max-w-[160px] sm:max-w-none">
              {tournamentName}
            </span>
          </div>

          {/* Language Selector */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setIsLanguageOpen(!isLanguageOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1b1930] hover:bg-[#252240] border border-white/10 text-xs text-slate-300 font-semibold transition-all cursor-pointer"
            >
              <span className="text-xs">Lang:</span>
              <span className="font-bold text-white">{selectedLanguage}</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {isLanguageOpen && (
              <div className="absolute left-0 mt-1.5 w-36 rounded-xl bg-[#1b1930] border border-white/15 py-1 shadow-2xl z-50">
                {['English', 'Español', 'Français', 'Deutsch'].map((lang) => (
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

        {/* Center: Quick navigation */}
        <nav className="hidden lg:flex items-center gap-1.5 bg-[#17152a] p-1.5 rounded-2xl border border-white/5">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Matches</span>
          </Link>

          <Link
            href="/multistream"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Multi-Stream</span>
          </Link>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleFullscreen}
            className="h-8 w-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ── 2. MAIN BROADCAST CANVAS & TACTICAL RAIL ── */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto p-3 sm:p-5 flex flex-col xl:flex-row gap-5">
        
        {/* Left / Center: Video Stream + Unobstructed Controls + Tactical Panels Below */}
        <div className="flex-1 flex flex-col gap-5 min-w-0">
          
          {/* Main Broadcast Container (Video Stream & Servers) */}
          <div className="w-full rounded-3xl overflow-hidden bg-[#0d0c15] border border-white/10 shadow-2xl flex flex-col p-3 sm:p-4">
            
            {/* Top Match Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3 px-1">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600/90 text-white text-[11px] font-black uppercase tracking-wider animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  <span>Live Broadcast</span>
                </span>
                <h2 className="text-sm sm:text-base font-extrabold text-white truncate drop-shadow">
                  {hubData.homeName} vs {hubData.awayName}
                </h2>
              </div>

              {match.currentMinute && (
                <span className="text-xs font-mono font-bold text-purple-300 bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 rounded-lg">
                  ⏱ {match.currentMinute}
                </span>
              )}
            </div>

            {/* Video Player Container — Full Height, Completely Clear of Overlapping Cards */}
            <div className="w-full">
              {currentStreamUrl && !errorMsg ? (
                <StreamPlayer
                  streamUrl={currentStreamUrl}
                  channels={currentChannels}
                  matchTitle={match.title}
                  matchStatus={match.status}
                />
              ) : (
                <div 
                  className="w-full aspect-video min-h-[360px] rounded-2xl bg-cover bg-center flex items-center justify-center relative border border-white/10"
                  style={{
                    backgroundImage: `linear-gradient(to bottom, rgba(13,12,21,0.7), rgba(13,12,21,0.9)), url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1600')`
                  }}
                >
                  <div className="text-center p-6 space-y-2 z-10 max-w-md bg-black/60 backdrop-blur-md rounded-2xl border border-white/10">
                    <RefreshCw className="h-6 w-6 text-purple-400 animate-spin mx-auto mb-2" />
                    <h3 className="text-sm font-black text-white">Connecting to Stadium Broadcast</h3>
                    <p className="text-xs text-slate-300">
                      Syncing streaming servers for {hubData.homeName} vs {hubData.awayName}...
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── 3. TACTICAL MATCH TELEMETRY (PLACED CLEANLY BELOW VIDEO PLAYER) ── */}
          <div className="w-full rounded-3xl bg-[#131124] border border-white/10 p-4 sm:p-6 shadow-2xl flex flex-col gap-4">
            
            {/* Tactical Navigation Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
                <button
                  onClick={() => setTacticalTab('lineups')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                    tacticalTab === 'lineups'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>
                    {hubData.sport === 'basketball' ? 'Starting 5 & Roster' :
                     hubData.sport === 'hockey' ? 'Starting 6 & Lines' :
                     hubData.sport === 'tennis' ? 'Head-to-Head Draw' :
                     'Formations & Lineups'}
                  </span>
                </button>

                <button
                  onClick={() => setTacticalTab('subs')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                    tacticalTab === 'subs'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  <span>
                    {hubData.sport === 'basketball' ? `Rotations (${hubData.substitutions.length})` :
                     hubData.sport === 'hockey' ? `Line Changes (${hubData.substitutions.length})` :
                     hubData.sport === 'tennis' ? 'Match Progress' :
                     `Substitutions (${hubData.substitutions.length})`}
                  </span>
                </button>

                <button
                  onClick={() => setTacticalTab('discipline')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                    tacticalTab === 'discipline'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                  <span>
                    {hubData.sport === 'basketball' ? `Fouls (${hubData.cards.length})` :
                     hubData.sport === 'hockey' ? `Penalties (${hubData.cards.length})` :
                     hubData.sport === 'tennis' ? 'Serve & Faults' :
                     `Discipline (${hubData.cards.length})`}
                  </span>
                </button>

                <button
                  onClick={() => setTacticalTab('stats')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                    tacticalTab === 'stats'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <BarChart2 className="h-3.5 w-3.5" />
                  <span>
                    {hubData.sport === 'basketball' ? 'Game Statistics' :
                     hubData.sport === 'hockey' ? 'Game Statistics' :
                     hubData.sport === 'tennis' ? 'Match Statistics' :
                     'Detailed Statistics'}
                  </span>
                </button>

                <button
                  onClick={() => setTacticalTab('zones')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                    tacticalTab === 'zones'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Activity className="h-3.5 w-3.5" />
                  <span>
                    {hubData.sport === 'basketball' ? 'Court Shot Zones' :
                     hubData.sport === 'hockey' ? 'Rink Attack Zones' :
                     hubData.sport === 'tennis' ? 'Court Placement' :
                     'Attack Zones & Keys'}
                  </span>
                </button>
              </div>

              {/* Team Switcher Toggle */}
              <div className="flex items-center gap-1 bg-[#1a172e] p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setSelectedTeamTab('home')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedTeamTab === 'home'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <img src={hubData.homeBadge} alt="" className="h-4 w-4 object-contain" />
                  <span className="truncate max-w-[100px]">{hubData.homeName}</span>
                </button>

                <button
                  onClick={() => setSelectedTeamTab('away')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedTeamTab === 'away'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <img src={hubData.awayBadge} alt="" className="h-4 w-4 object-contain" />
                  <span className="truncate max-w-[100px]">{hubData.awayName}</span>
                </button>
              </div>
            </div>

            {/* TAB CONTENT 1: FORMATIONS & LINEUPS */}
            {tacticalTab === 'lineups' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* Visual Tactical Pitch / Court (Left 6 Cols) */}
                {hubData.sport === 'basketball' ? (
                  <div className="lg:col-span-6 rounded-2xl bg-gradient-to-b from-[#251508] via-[#1c0f05] to-[#120a03] border border-amber-600/40 p-4 relative shadow-inner overflow-hidden min-h-[380px] flex flex-col justify-between">
                    {/* Hardwood floor lines & markings */}
                    <div className="absolute inset-0 opacity-25 pointer-events-none">
                      <div className="absolute top-1/2 left-0 right-0 h-px bg-amber-400" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 border border-amber-400 rounded-full" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border border-amber-400 rounded-full" />
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-32 border-b-2 border-x-2 border-amber-400/80 rounded-b-full" />
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-24 border-b border-x border-amber-400/90 bg-amber-900/10" />
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-32 border-t-2 border-x-2 border-amber-400/80 rounded-t-full" />
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-24 border-t border-x border-amber-400/90 bg-amber-900/10" />
                    </div>

                    <div className="relative z-10 flex items-center justify-between bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                      <div className="flex items-center gap-2">
                        <img src={currentTeamBadge} alt="" className="h-5 w-5 rounded-full object-cover" />
                        <span className="text-xs font-black text-white">{currentTeamName}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-black uppercase tracking-wider">
                        Starting 5 Lineup
                      </span>
                    </div>

                    {/* Basketball 5 Players Court Placement */}
                    <div className="relative z-10 flex-1 flex flex-col justify-around py-4">
                      {/* PG */}
                      <div className="flex items-center justify-center">
                        {currentStarters.filter(p => p.positionGroup === 'PG').concat(currentStarters.slice(0, 1)).slice(0, 1).map((p, idx) => (
                          <div key={idx} className="flex flex-col items-center group">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-amber-500 to-amber-700 border-2 border-amber-200 flex items-center justify-center text-xs font-black text-white shadow-lg group-hover:scale-110 transition-transform">
                              {p.jersey}
                            </div>
                            <span className="text-[10px] font-bold text-amber-200 mt-1 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-amber-500/30">
                              PG · {p.name.split(' ').slice(-1)[0]}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Wings SF & SG */}
                      <div className="flex items-center justify-around px-2">
                        {currentStarters.filter(p => p.positionGroup === 'SF').concat(currentStarters.slice(2, 3)).slice(0, 1).map((p, idx) => (
                          <div key={idx} className="flex flex-col items-center group">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-orange-500 to-amber-600 border-2 border-amber-200 flex items-center justify-center text-xs font-black text-white shadow-lg group-hover:scale-110 transition-transform">
                              {p.jersey}
                            </div>
                            <span className="text-[10px] font-bold text-amber-200 mt-1 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-amber-500/30">
                              SF · {p.name.split(' ').slice(-1)[0]}
                            </span>
                          </div>
                        ))}

                        {currentStarters.filter(p => p.positionGroup === 'SG').concat(currentStarters.slice(1, 2)).slice(0, 1).map((p, idx) => (
                          <div key={idx} className="flex flex-col items-center group">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-orange-500 to-amber-600 border-2 border-amber-200 flex items-center justify-center text-xs font-black text-white shadow-lg group-hover:scale-110 transition-transform">
                              {p.jersey}
                            </div>
                            <span className="text-[10px] font-bold text-amber-200 mt-1 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-amber-500/30">
                              SG · {p.name.split(' ').slice(-1)[0]}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Frontcourt PF & C */}
                      <div className="flex items-center justify-center gap-12">
                        {currentStarters.filter(p => p.positionGroup === 'PF').concat(currentStarters.slice(3, 4)).slice(0, 1).map((p, idx) => (
                          <div key={idx} className="flex flex-col items-center group">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-yellow-600 to-amber-700 border-2 border-amber-200 flex items-center justify-center text-xs font-black text-white shadow-lg group-hover:scale-110 transition-transform">
                              {p.jersey}
                            </div>
                            <span className="text-[10px] font-bold text-amber-200 mt-1 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-amber-500/30">
                              PF · {p.name.split(' ').slice(-1)[0]}
                            </span>
                          </div>
                        ))}

                        {currentStarters.filter(p => p.positionGroup === 'C').concat(currentStarters.slice(4, 5)).slice(0, 1).map((p, idx) => (
                          <div key={idx} className="flex flex-col items-center group">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-amber-600 to-red-700 border-2 border-amber-200 flex items-center justify-center text-xs font-black text-white shadow-lg group-hover:scale-110 transition-transform">
                              {p.jersey}
                            </div>
                            <span className="text-[10px] font-bold text-amber-200 mt-1 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-amber-500/30">
                              C · {p.name.split(' ').slice(-1)[0]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : hubData.sport === 'hockey' ? (
                  <div className="lg:col-span-6 rounded-2xl bg-gradient-to-b from-[#0c2438] via-[#091a28] to-[#05111b] border border-cyan-400/40 p-4 relative shadow-inner overflow-hidden min-h-[380px] flex flex-col justify-between">
                    {/* Ice rink markings */}
                    <div className="absolute inset-0 opacity-30 pointer-events-none">
                      <div className="absolute top-1/2 left-0 right-0 h-1 bg-rose-500" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 border-2 border-rose-500 rounded-full" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full" />
                      <div className="absolute top-1/3 left-0 right-0 h-1 bg-blue-500" />
                      <div className="absolute bottom-1/3 left-0 right-0 h-1 bg-blue-500" />
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-12 border-b-2 border-x-2 border-rose-500 bg-cyan-400/20 rounded-b-full" />
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-12 border-t-2 border-x-2 border-rose-500 bg-cyan-400/20 rounded-t-full" />
                    </div>

                    <div className="relative z-10 flex items-center justify-between bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                      <div className="flex items-center gap-2">
                        <img src={currentTeamBadge} alt="" className="h-5 w-5 rounded-full object-cover" />
                        <span className="text-xs font-black text-white">{currentTeamName}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[11px] font-black uppercase tracking-wider">
                        Starting 6 On-Ice Unit
                      </span>
                    </div>

                    <div className="relative z-10 flex-1 flex flex-col justify-around py-4">
                      {/* Forwards */}
                      <div className="flex items-center justify-around">
                        <div className="flex flex-col items-center group">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 border-2 border-white flex items-center justify-center text-xs font-black text-white shadow-lg group-hover:scale-110 transition-transform">
                            {(currentStarters.find(p => p.positionGroup === 'LW') || currentStarters[1])?.jersey || '18'}
                          </div>
                          <span className="text-[10px] font-bold text-cyan-200 mt-1 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-cyan-500/30">
                            LW · {((currentStarters.find(p => p.positionGroup === 'LW') || currentStarters[1])?.name || 'Left Wing').split(' ').slice(-1)[0]}
                          </span>
                        </div>

                        <div className="flex flex-col items-center group">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-600 border-2 border-white flex items-center justify-center text-xs font-black text-white shadow-lg group-hover:scale-110 transition-transform">
                            {(currentStarters.find(p => p.positionGroup === 'C') || currentStarters[0])?.jersey || '97'}
                          </div>
                          <span className="text-[10px] font-bold text-cyan-200 mt-1 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-cyan-500/30">
                            C · {((currentStarters.find(p => p.positionGroup === 'C') || currentStarters[0])?.name || 'Center').split(' ').slice(-1)[0]}
                          </span>
                        </div>

                        <div className="flex flex-col items-center group">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 border-2 border-white flex items-center justify-center text-xs font-black text-white shadow-lg group-hover:scale-110 transition-transform">
                            {(currentStarters.find(p => p.positionGroup === 'RW') || currentStarters[2])?.jersey || '88'}
                          </div>
                          <span className="text-[10px] font-bold text-cyan-200 mt-1 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-cyan-500/30">
                            RW · {((currentStarters.find(p => p.positionGroup === 'RW') || currentStarters[2])?.name || 'Right Wing').split(' ').slice(-1)[0]}
                          </span>
                        </div>
                      </div>

                      {/* Defense */}
                      <div className="flex items-center justify-around px-8">
                        <div className="flex flex-col items-center group">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-700 border-2 border-white flex items-center justify-center text-xs font-black text-white shadow-lg group-hover:scale-110 transition-transform">
                            {(currentStarters.find(p => p.positionGroup === 'LD') || currentStarters[3])?.jersey || '4'}
                          </div>
                          <span className="text-[10px] font-bold text-blue-200 mt-1 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-blue-500/30">
                            LD · {((currentStarters.find(p => p.positionGroup === 'LD') || currentStarters[3])?.name || 'Left Defense').split(' ').slice(-1)[0]}
                          </span>
                        </div>

                        <div className="flex flex-col items-center group">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-700 border-2 border-white flex items-center justify-center text-xs font-black text-white shadow-lg group-hover:scale-110 transition-transform">
                            {(currentStarters.find(p => p.positionGroup === 'RD') || currentStarters[4])?.jersey || '8'}
                          </div>
                          <span className="text-[10px] font-bold text-blue-200 mt-1 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-blue-500/30">
                            RD · {((currentStarters.find(p => p.positionGroup === 'RD') || currentStarters[4])?.name || 'Right Defense').split(' ').slice(-1)[0]}
                          </span>
                        </div>
                      </div>

                      {/* Goalie */}
                      <div className="flex items-center justify-center">
                        <div className="flex flex-col items-center group">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-teal-400 to-emerald-600 border-2 border-white flex items-center justify-center text-xs font-black text-white shadow-lg group-hover:scale-110 transition-transform">
                            {(currentStarters.find(p => p.positionGroup === 'G') || currentStarters[5])?.jersey || '31'}
                          </div>
                          <span className="text-[10px] font-bold text-emerald-200 mt-1 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-emerald-500/30">
                            G · {((currentStarters.find(p => p.positionGroup === 'G') || currentStarters[5])?.name || 'Goaltender').split(' ').slice(-1)[0]}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : hubData.sport === 'tennis' ? (
                  <div className="lg:col-span-6 rounded-2xl bg-gradient-to-b from-[#0a291b] via-[#071d13] to-[#04120b] border border-emerald-500/40 p-4 relative shadow-inner overflow-hidden min-h-[380px] flex flex-col justify-between">
                    <div className="absolute inset-0 opacity-25 pointer-events-none">
                      <div className="absolute inset-4 border-2 border-white" />
                      <div className="absolute top-4 bottom-4 left-10 border-l border-white" />
                      <div className="absolute top-4 bottom-4 right-10 border-r border-white" />
                      <div className="absolute top-1/2 left-2 right-2 h-1 bg-white/90 shadow" />
                      <div className="absolute top-1/3 left-10 right-10 h-px bg-white" />
                      <div className="absolute bottom-1/3 left-10 right-10 h-px bg-white" />
                      <div className="absolute top-1/3 bottom-1/3 left-1/2 -translate-x-1/2 w-px bg-white" />
                    </div>

                    <div className="relative z-10 flex items-center justify-between bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                      <div className="flex items-center gap-2">
                        <img src={hubData.homeBadge} alt="" className="h-5 w-5 rounded-full object-cover" />
                        <span className="text-xs font-black text-white">Championship Singles</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-black uppercase tracking-wider">
                        Center Court
                      </span>
                    </div>

                    <div className="relative z-10 flex-1 flex flex-col justify-between py-6">
                      <div className="flex items-center justify-center">
                        <div className="flex flex-col items-center group">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 border-2 border-white flex items-center justify-center text-xs font-black text-white shadow-lg group-hover:scale-110 transition-transform">
                            2
                          </div>
                          <span className="text-xs font-black text-blue-200 mt-1 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-blue-500/30">
                            {hubData.awayName}
                          </span>
                          <span className="text-[10px] text-slate-300 font-semibold">Receiver</span>
                        </div>
                      </div>

                      <div className="text-center">
                        <span className="px-3 py-0.5 rounded-full bg-white/10 text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest border border-white/20">
                          NET
                        </span>
                      </div>

                      <div className="flex items-center justify-center">
                        <div className="flex flex-col items-center group">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 border-2 border-white flex items-center justify-center text-xs font-black text-white shadow-lg group-hover:scale-110 transition-transform">
                            1
                          </div>
                          <span className="text-xs font-black text-emerald-200 mt-1 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-emerald-500/30">
                            {hubData.homeName}
                          </span>
                          <span className="text-[10px] text-slate-300 font-semibold">Server</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="lg:col-span-6 rounded-2xl bg-gradient-to-b from-[#092e1e] to-[#041910] border border-emerald-500/30 p-4 relative shadow-inner overflow-hidden min-h-[380px] flex flex-col justify-between">
                    {/* Pitch markings */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-20 border-b border-x border-white rounded-b-2xl" />
                      <div className="absolute top-1/2 left-0 right-0 h-px bg-white" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 border border-white rounded-full" />
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-20 border-t border-x border-white rounded-t-2xl" />
                    </div>

                    {/* Pitch Top: Formation Header */}
                    <div className="relative z-10 flex items-center justify-between bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                      <div className="flex items-center gap-2">
                        <img src={currentTeamBadge} alt="" className="h-5 w-5 rounded-full object-cover" />
                        <span className="text-xs font-black text-white">{currentTeamName}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-black uppercase">
                        Formation {currentFormation}
                      </span>
                    </div>

                    {/* Dynamic Pitch Rows accurately arranged by formation (e.g. 4-2-3-1, 4-3-3, 3-5-2) */}
                    <div className="relative z-10 flex-1 flex flex-col justify-around py-3 gap-2">
                      {outfieldRows.map((rowPlayers, rIdx) => (
                        <div key={rIdx} className="flex items-center justify-around w-full px-2">
                          {rowPlayers.map((p, pIdx) => {
                            const cleanName = p.name?.toLowerCase().trim();
                            const faceUrl = playerFaces[cleanName] || p.avatar;
                            return (
                              <div key={p.id || pIdx} title={`${p.name} #${p.jersey} (${p.position})`} className="flex flex-col items-center group relative cursor-pointer">
                                <div className="relative h-10 w-10 sm:h-11 sm:w-11 rounded-full border-2 border-white/85 bg-gradient-to-tr from-[#1a103c] via-[#2d1b69] to-[#4c1d95] flex items-center justify-center shadow-lg group-hover:scale-115 group-hover:border-purple-400 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all duration-300">
                                  {faceUrl ? (
                                    <img
                                      src={faceUrl}
                                      alt={p.name}
                                      className="h-full w-full rounded-full object-cover object-top"
                                      loading="lazy"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  ) : null}
                                  <span className="text-[11px] font-black text-white absolute inset-0 flex items-center justify-center -z-0">
                                    {p.jersey}
                                  </span>

                                  {/* Small Jersey Number Badge */}
                                  <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-purple-600 border border-white text-[8.5px] font-black text-white flex items-center justify-center shadow">
                                    {p.jersey}
                                  </span>
                                </div>

                                <span className="text-[9.5px] font-bold text-white mt-1 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md truncate max-w-[95px] border border-white/10 shadow text-center flex items-center justify-center gap-1">
                                  <span>{p.name.split(' ').slice(-1)[0]}</span>
                                  {p.position && (
                                    <span className="text-[7.5px] text-purple-300 font-black uppercase opacity-90">{p.position}</span>
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ))}

                      {/* Goalkeeper */}
                      <div className="flex items-center justify-center w-full">
                        {gk.map((p, idx) => {
                          const cleanName = p.name?.toLowerCase().trim();
                          const faceUrl = playerFaces[cleanName] || p.avatar;
                          return (
                            <div key={p.id || idx} title={`${p.name} #${p.jersey} (Goalkeeper)`} className="flex flex-col items-center group relative cursor-pointer">
                              <div className="relative h-10 w-10 sm:h-11 sm:w-11 rounded-full border-2 border-emerald-300 bg-gradient-to-tr from-[#064e3b] to-[#047857] flex items-center justify-center shadow-lg group-hover:scale-115 group-hover:border-emerald-200 transition-all duration-300">
                                {faceUrl ? (
                                  <img
                                    src={faceUrl}
                                    alt={p.name}
                                    className="h-full w-full rounded-full object-cover object-top"
                                    loading="lazy"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                ) : null}
                                <span className="text-[11px] font-black text-white absolute inset-0 flex items-center justify-center -z-0">
                                  {p.jersey}
                                </span>

                                <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-600 border border-white text-[8.5px] font-black text-white flex items-center justify-center shadow">
                                  {p.jersey}
                                </span>
                              </div>

                              <span className="text-[9.5px] font-bold text-emerald-200 mt-1 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md truncate max-w-[95px] border border-emerald-500/30 shadow text-center flex items-center justify-center gap-1">
                                <span>{p.name.split(' ').slice(-1)[0]}</span>
                                <span className="text-[7.5px] text-emerald-400 font-black uppercase opacity-90">GK</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Starting Roster (Right 6 Cols) */}
                <div className="lg:col-span-6 flex flex-col gap-2">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                      {hubData.sport === 'basketball' ? `Starting 5 Roster (${currentStarters.length} Players)` :
                       hubData.sport === 'hockey' ? `Starting 6 Unit (${currentStarters.length} Players)` :
                       hubData.sport === 'tennis' ? `Competitor Profiles (${currentStarters.length} Players)` :
                       `Starting XI Roster (${currentStarters.length} Players)`}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-semibold">{currentTeamName}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto max-h-[340px] pr-1">
                    {currentStarters.map((player, idx) => {
                      const cleanName = player.name?.toLowerCase().trim();
                      const faceUrl = playerFaces[cleanName] || player.avatar;
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-all"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="relative h-7 w-7 rounded-full bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center shrink-0">
                              {faceUrl ? (
                                <img
                                  src={faceUrl}
                                  alt={player.name}
                                  className="h-full w-full object-cover object-top"
                                  loading="lazy"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              ) : null}
                              <span className="text-[10px] font-black text-purple-300 absolute inset-0 flex items-center justify-center -z-0">
                                {player.jersey}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-white truncate">
                              {player.name}
                            </span>
                          </div>

                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase shrink-0 ${
                            player.positionGroup === 'GK' || player.positionGroup === 'G'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : player.positionGroup === 'DF' || player.positionGroup === 'LD' || player.positionGroup === 'RD' || player.positionGroup === 'PF'
                              ? 'bg-blue-500/20 text-blue-300'
                              : player.positionGroup === 'MF' || player.positionGroup === 'PG' || player.positionGroup === 'SG' || player.positionGroup === 'C'
                              ? 'bg-purple-500/20 text-purple-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}>
                            {player.position}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: SUBSTITUTES & IN-GAME SUBSTITUTIONS */}
            {tacticalTab === 'subs' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* In-Game Substitutions Timeline (Left 6 Cols) */}
                <div className="lg:col-span-6 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                      {hubData.sport === 'basketball' ? 'In-Game Rotations Timeline' :
                       hubData.sport === 'hockey' ? 'On-Ice Line Changes' :
                       hubData.sport === 'tennis' ? 'Match Progress' :
                       'In-Game Substitutions Timeline'}
                    </h3>
                    <span className="text-[11px] text-purple-400 font-bold">{hubData.substitutions.length} recorded</span>
                  </div>

                  {hubData.substitutions.length > 0 ? (
                    <div className="space-y-2">
                      {hubData.substitutions.map((sub, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"
                        >
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 rounded bg-purple-600/30 text-purple-300 text-xs font-bold border border-purple-500/30">
                              {sub.minute}
                            </span>
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                                <span>🟢 IN:</span>
                                <span className="text-white">{sub.playerIn}</span>
                              </p>
                              <p className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                                <span>🔴 OUT:</span>
                                <span className="text-slate-300">{sub.playerOut}</span>
                              </p>
                            </div>
                          </div>

                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white/10 text-slate-300">
                            {sub.team === 'home' ? hubData.homeName : hubData.awayName}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/5">
                      <ArrowRightLeft className="h-6 w-6 text-slate-500 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-300">
                        {hubData.sport === 'basketball' ? 'No rotation changes made yet' : 'No substitutions made yet'}
                      </p>
                      <p className="text-[11px] text-slate-500">Live roster updates will be tracked in real-time as tactical swaps occur.</p>
                    </div>
                  )}
                </div>

                {/* Substitute Bench Roster (Right 6 Cols) */}
                <div className="lg:col-span-6 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                      {currentTeamName} {hubData.sport === 'basketball' ? 'Bench Reserves' : hubData.sport === 'hockey' ? 'On-Deck Lines' : 'Substitute Bench'} ({currentSubstitutes.length})
                    </h3>
                    <span className="text-[11px] text-slate-400">Available Reserves</span>
                  </div>

                  {currentSubstitutes.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto max-h-[300px] pr-1">
                      {currentSubstitutes.map((player, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="h-6 w-6 rounded-md bg-white/10 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                              {player.jersey}
                            </span>
                            <span className="text-xs font-bold text-white truncate">
                              {player.name}
                            </span>
                          </div>

                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 uppercase shrink-0">
                            {player.position}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/5">
                      <Users className="h-6 w-6 text-slate-500 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-300">No reserve players listed</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: DISCIPLINE & CARDS */}
            {tacticalTab === 'discipline' && (
              <div className="space-y-4">
                {/* Yellow & Red Card Summary Header */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 block mb-1">
                      {hubData.homeName} {hubData.sport === 'basketball' ? 'Personal Fouls' : hubData.sport === 'hockey' ? 'Minor Pens' : hubData.sport === 'tennis' ? 'Double Faults' : 'Yellows'}
                    </span>
                    <span className="text-2xl font-black text-amber-300">
                      {hubData.sport === 'basketball' ? hubData.fouls.home : hubData.discipline.yellowCards.home}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-400 block mb-1">
                      {hubData.homeName} {hubData.sport === 'basketball' ? 'Tech Fouls' : hubData.sport === 'hockey' ? 'Major / PIM' : hubData.sport === 'tennis' ? 'Unforced Errors' : 'Reds'}
                    </span>
                    <span className="text-2xl font-black text-rose-300">{hubData.discipline.redCards.home}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 block mb-1">
                      {hubData.awayName} {hubData.sport === 'basketball' ? 'Personal Fouls' : hubData.sport === 'hockey' ? 'Minor Pens' : hubData.sport === 'tennis' ? 'Double Faults' : 'Yellows'}
                    </span>
                    <span className="text-2xl font-black text-amber-300">
                      {hubData.sport === 'basketball' ? hubData.fouls.away : hubData.discipline.yellowCards.away}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-400 block mb-1">
                      {hubData.awayName} {hubData.sport === 'basketball' ? 'Tech Fouls' : hubData.sport === 'hockey' ? 'Major / PIM' : hubData.sport === 'tennis' ? 'Unforced Errors' : 'Reds'}
                    </span>
                    <span className="text-2xl font-black text-rose-300">{hubData.discipline.redCards.away}</span>
                  </div>
                </div>

                {/* Card Events Timeline */}
                <div className="flex flex-col gap-2 pt-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 pb-2 border-b border-white/10">
                    {hubData.sport === 'basketball' ? `Fouls & Violations (${hubData.cards.length})` :
                     hubData.sport === 'hockey' ? `Penalties & Infractions (${hubData.cards.length})` :
                     hubData.sport === 'tennis' ? `Service & Point Faults (${hubData.cards.length})` :
                     `Disciplinary Events (${hubData.cards.length})`}
                  </h3>

                  {hubData.cards.length > 0 ? (
                    <div className="space-y-2">
                      {hubData.cards.map((card, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"
                        >
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 rounded bg-white/10 text-white text-xs font-bold">
                              {card.minute}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className={`inline-block w-3 h-4 rounded-sm shadow-sm ${
                                card.cardType === 'red' ? 'bg-rose-500 shadow-rose-500/50' : 'bg-amber-400 shadow-amber-400/50'
                              }`} />
                              <span className="text-xs font-black text-white">{card.player}</span>
                              <span className="text-xs text-slate-400">({card.text})</span>
                            </div>
                          </div>

                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white/10 text-slate-300">
                            {card.team === 'home' ? hubData.homeName : hubData.awayName}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/5">
                      <Shield className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
                      <p className="text-xs font-bold text-white">Clean Discipline Record</p>
                      <p className="text-[11px] text-slate-400">
                        {hubData.sport === 'basketball' ? 'No personal or technical fouls flagged yet.' :
                         hubData.sport === 'hockey' ? 'No penalty minutes assessed yet.' :
                         'No disciplinary incidents reported in this fixture yet.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT 4: DETAILED STATISTICS */}
            {tacticalTab === 'stats' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-black pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <img src={hubData.homeBadge} alt="" className="h-4 w-4 rounded-full object-cover" />
                    <span className="text-emerald-400">{hubData.homeName}</span>
                  </div>
                  <span className="text-slate-400 uppercase tracking-widest text-[11px]">
                    {hubData.sport.toUpperCase()} TELEMETRY
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">{hubData.awayName}</span>
                    <img src={hubData.awayBadge} alt="" className="h-4 w-4 rounded-full object-cover" />
                  </div>
                </div>

                <div className="space-y-3.5">
                  {hubData.sportMetrics && hubData.sportMetrics.length > 0 ? (
                    hubData.sportMetrics.map((metric, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-emerald-400 font-mono">{metric.home}</span>
                          <span className="text-slate-300 font-semibold">{metric.label}</span>
                          <span className="text-blue-400 font-mono">{metric.away}</span>
                        </div>
                        <div className="h-2 w-full bg-[#1c1a2e] rounded-full flex overflow-hidden p-0.5">
                          <div
                            className="bg-emerald-500 h-full rounded-l-full transition-all duration-300"
                            style={{ width: `${metric.homePct ?? 50}%` }}
                          />
                          <div
                            className="bg-blue-500 h-full rounded-r-full transition-all duration-300"
                            style={{ width: `${metric.awayPct ?? 50}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-emerald-400">{hubData.possession.home}%</span>
                          <span className="text-slate-300 font-semibold">Ball Possession</span>
                          <span className="text-blue-400">{hubData.possession.away}%</span>
                        </div>
                        <div className="h-2 w-full bg-[#1c1a2e] rounded-full flex overflow-hidden p-0.5">
                          <div className="bg-emerald-500 h-full rounded-l-full" style={{ width: `${hubData.possession.home}%` }} />
                          <div className="bg-blue-500 h-full rounded-r-full" style={{ width: `${hubData.possession.away}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-emerald-400">{hubData.shotsOnTarget.home}</span>
                          <span className="text-slate-300 font-semibold">Shots on Target</span>
                          <span className="text-blue-400">{hubData.shotsOnTarget.away}</span>
                        </div>
                        <div className="h-2 w-full bg-[#1c1a2e] rounded-full flex overflow-hidden p-0.5">
                          <div
                            className="bg-emerald-500 h-full rounded-l-full"
                            style={{ width: `${Math.round((hubData.shotsOnTarget.home / (hubData.shotsOnTarget.home + hubData.shotsOnTarget.away || 1)) * 100)}%` }}
                          />
                          <div
                            className="bg-blue-500 h-full rounded-r-full"
                            style={{ width: `${Math.round((hubData.shotsOnTarget.away / (hubData.shotsOnTarget.home + hubData.shotsOnTarget.away || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT 5: ATTACK ZONES & KEY PLAYERS */}
            {tacticalTab === 'zones' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Attack Channels (Left 6 Cols) */}
                <div className="lg:col-span-6 rounded-2xl bg-white/5 border border-white/5 p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 mb-1">
                      {hubData.sport === 'basketball' ? 'Court Shot Distribution' :
                       hubData.sport === 'hockey' ? 'Offensive Zone Generation' :
                       hubData.sport === 'tennis' ? 'Court Shot Placement' :
                       'Pitch Attack Channels'}
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">{hubData.attackZones.description}</p>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase block mb-1">
                          {hubData.attackZones.leftLabel || 'Left'}
                        </span>
                        <span className="text-lg font-black text-purple-400">{hubData.attackZones.left}%</span>
                      </div>
                      <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase block mb-1">
                          {hubData.attackZones.centerLabel || 'Center'}
                        </span>
                        <span className="text-lg font-black text-emerald-400">{hubData.attackZones.center}%</span>
                      </div>
                      <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase block mb-1">
                          {hubData.attackZones.rightLabel || 'Right'}
                        </span>
                        <span className="text-lg font-black text-blue-400">{hubData.attackZones.right}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold">
                    <span className="text-emerald-400">{hubData.homeName}: {hubData.attackZones.homePercentage}% dominance</span>
                    <span className="text-blue-400">{hubData.awayName}: {hubData.attackZones.awayPercentage}% dominance</span>
                  </div>
                </div>

                {/* Key Players of Match (Right 6 Cols) */}
                <div className="lg:col-span-6 space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 pb-2 border-b border-white/10">
                    {currentTeamName} Tactical Key Players
                  </h3>

                  <div className="space-y-2">
                    {(selectedTeamTab === 'home' ? hubData.homeKeyPlayers : hubData.awayKeyPlayers).map((kp, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="h-7 w-7 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-xs font-black text-purple-300">
                            {kp.jersey}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-white">{kp.name}</p>
                            <p className="text-[10px] text-slate-400">{kp.role}</p>
                          </div>
                        </div>

                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-white/10 text-slate-300 uppercase">
                          {kp.position || 'PL'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ── 4. RIGHT TACTICAL MATCH RAIL (ZERO MOCK DATA) ── */}
        <aside className="w-full xl:w-[380px] flex flex-col gap-4 shrink-0">
          
          {/* CARD 1: Match Scoreboard & Scorers (Real Data Strictly) */}
          <div className="rounded-3xl bg-[#131222]/95 backdrop-blur-xl border border-white/10 p-5 shadow-2xl">
            {/* Header: "Match" | Date */}
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Match Scoreboard
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                <Calendar className="h-3 w-3 text-slate-400" />
                <span>{hubData.matchDate}</span>
              </span>
            </div>

            {/* Subheader: Stage & Venue */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium pt-2 pb-3">
              <span>{hubData.stage}</span>
              <span className="truncate max-w-[150px]">{hubData.venue}</span>
            </div>

            {/* Scoreboard: Team Crest | Score | Team Crest */}
            <div className="py-2 flex items-center justify-between px-2">
              {/* Home Team */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="h-12 w-12 rounded-2xl p-1 bg-white/10 border border-white/20 flex items-center justify-center shadow-lg overflow-hidden">
                  <img
                    src={hubData.homeBadge}
                    alt={hubData.homeName}
                    className="max-h-10 max-w-10 object-contain drop-shadow"
                  />
                </div>
                <span className="text-[11px] font-bold text-white text-center truncate max-w-[80px]">
                  {hubData.homeName}
                </span>
              </div>

              {/* Score */}
              <div className="text-3xl sm:text-4xl font-black text-white tracking-wider tabular-nums flex items-center gap-2">
                <span>{match.homeScore ?? 0}</span>
                <span className="text-slate-500 font-light">-</span>
                <span>{match.awayScore ?? 0}</span>
              </div>

              {/* Away Team */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="h-12 w-12 rounded-2xl p-1 bg-white/10 border border-white/20 flex items-center justify-center shadow-lg overflow-hidden">
                  <img
                    src={hubData.awayBadge}
                    alt={hubData.awayName}
                    className="max-h-10 max-w-10 object-contain drop-shadow"
                  />
                </div>
                <span className="text-[11px] font-bold text-white text-center truncate max-w-[80px]">
                  {hubData.awayName}
                </span>
              </div>
            </div>

            {/* Scorers List: Strictly Real Match Goals */}
            <div className="mt-3 pt-3 border-t border-white/5">
              {hubData.homeScorersList.length > 0 || hubData.awayScorersList.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* Home Scorers */}
                  <div className="space-y-1 text-left">
                    {hubData.homeScorersList.map((s, idx) => (
                      <p key={idx} className="text-slate-200 font-bold truncate">
                        <span>{s.player} </span>
                        <span className="text-purple-400 font-mono text-[11px]">{s.minutes}</span>
                      </p>
                    ))}
                  </div>

                  {/* Away Scorers */}
                  <div className="space-y-1 text-right">
                    {hubData.awayScorersList.map((s, idx) => (
                      <p key={idx} className="text-slate-200 font-bold truncate">
                        <span>{s.player} </span>
                        <span className="text-blue-400 font-mono text-[11px]">{s.minutes}</span>
                      </p>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 text-center font-medium italic py-1">
                  No goals scored in this fixture yet
                </p>
              )}
            </div>
          </div>

          {/* CARD 2: Star Player / Man of the Match (Strictly from this fixture!) */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#7c3aed] via-[#6d28d9] to-[#4c1d95] p-5 shadow-2xl shadow-purple-600/30 text-white min-h-[200px] flex flex-col justify-between">
            {/* Watermark Jersey Number */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[120px] font-black text-white/10 select-none pointer-events-none leading-none">
              {hubData.bestPlayer.jersey}
            </div>

            {/* Card Header: "Featured Match Performer" & Goals / Assists */}
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-purple-200 block">
                  Featured Match Performer
                </span>
                <span className="text-[11px] text-purple-300 font-semibold">{hubData.bestPlayer.teamName}</span>
              </div>

              {/* Goals & Assists Pill */}
              <div className="flex gap-1.5 text-right text-xs font-black">
                <div className="bg-black/30 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/15">
                  <span className="text-[9px] text-purple-200 uppercase block leading-tight">Goals</span>
                  <span className="text-sm font-black">{hubData.bestPlayer.goals}</span>
                </div>
              </div>
            </div>

            {/* Bottom: Player Avatar & Jersey Badge + Name & Team Badge */}
            {(() => {
              const cleanBestName = hubData.bestPlayer?.name?.toLowerCase().trim();
              const bestFaceUrl = playerFaces[cleanBestName] || hubData.bestPlayer?.avatar;
              return (
                <div className="relative z-10 pt-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Player Face Photo with Jersey Number Badge overlay */}
                    <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-2xl border-2 border-white/80 bg-black/40 shadow-xl overflow-visible shrink-0">
                      <div className="h-full w-full rounded-2xl overflow-hidden bg-gradient-to-tr from-purple-900 to-indigo-950 flex items-center justify-center">
                        {bestFaceUrl ? (
                          <img
                            src={bestFaceUrl}
                            alt={hubData.bestPlayer.name}
                            className="h-full w-full object-cover object-top"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : null}
                        <span className="text-sm font-black text-purple-300 absolute inset-0 flex items-center justify-center -z-0">
                          #{hubData.bestPlayer.jersey}
                        </span>
                      </div>

                      {/* Small Jersey Number Badge */}
                      <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 min-w-[20px] rounded-lg bg-amber-400 text-slate-950 border border-white text-[9.5px] font-black flex items-center justify-center shadow-lg">
                        #{hubData.bestPlayer.jersey}
                      </span>
                    </div>

                    {/* Name, Jersey Chip and Team */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-black/40 text-amber-300 font-mono text-[10px] font-black border border-white/15">
                          #{hubData.bestPlayer.jersey}
                        </span>
                        <h3 className="text-base sm:text-lg font-black text-white leading-tight truncate">
                          {hubData.bestPlayer.name}
                        </h3>
                      </div>
                      <span className="text-xs text-purple-200 font-medium block truncate mt-0.5">
                        {hubData.bestPlayer.teamName}
                      </span>
                    </div>
                  </div>

                  {/* Team Badge */}
                  <div className="h-10 w-10 rounded-2xl bg-white/20 p-1 flex items-center justify-center shrink-0 border border-white/30 overflow-hidden shadow-lg">
                    <img
                      src={hubData.bestPlayer.teamBadge}
                      alt=""
                      className="max-h-8 max-w-8 object-contain drop-shadow"
                    />
                  </div>
                </div>
              );
            })()}
          </div>

          {/* CARD 3: Match Minute & Timeline Progress */}
          <div className="rounded-3xl bg-[#131222]/95 backdrop-blur-xl border border-white/10 p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Match Timeline
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-600/30 border border-purple-500/30 text-xs font-mono font-bold text-purple-300">
                <span>⏱</span>
                <span>{match.currentMinute || 'Live'}</span>
              </span>
            </div>

            {/* Events summary */}
            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
              {hubData.timelineEvents.length > 0 ? (
                hubData.timelineEvents.map((evt, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-white/5">
                    <span className="font-mono text-purple-400 font-bold">{evt.displayMinute}</span>
                    <span className="text-slate-200 font-medium truncate max-w-[200px]">
                      {evt.type === 'goal' ? '⚽ Goal! ' : evt.type === 'yellow_card' ? '🟨 ' : evt.type === 'red_card' ? '🟥 ' : '🔄 '}
                      {evt.player || evt.text}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-slate-500 text-center italic py-3">
                  Match events will appear here in real-time
                </p>
              )}
            </div>
          </div>

          {/* CARD 4: AI Match Insight */}
          {showAiInsight && (
            <div className="rounded-2xl bg-[#141224] border border-white/10 p-3.5 shadow-2xl flex items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-500 to-pink-500 p-0.5 shadow-lg shadow-pink-500/30 flex items-center justify-center shrink-0 animate-pulse">
                  <div className="h-full w-full rounded-full bg-[#141224] flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-pink-400" />
                  </div>
                </div>

                <p className="text-xs text-slate-200 font-semibold leading-snug">
                  {hubData.attackZones.description}
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
