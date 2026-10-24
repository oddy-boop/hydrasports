'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Hls from 'hls.js';
import {
  Layers,
  ArrowLeft,
  RefreshCw,
  Plus,
  X,
  Volume2,
  VolumeX,
  Maximize,
  Search,
  Grid2x2,
  Columns2,
  Square,
  Sliders,
  Wifi,
  WifiOff,
  Flame,
  Tv,
  Check,
  ChevronDown,
  ShieldAlert,
  Play,
  Pause,
  Shuffle
} from 'lucide-react';

export default function MultiStreamPage() {
  // 4 Slot State
  const [slots, setSlots] = useState([null, null, null, null]);
  const [layoutMode, setLayoutMode] = useState('quad'); // 'quad' | 'spotlight' | 'split' | 'focus'
  const [focusedAudioIndex, setFocusedAudioIndex] = useState(0); // Only 1 slot has audio active
  const [lowDataGlobal, setLowDataGlobal] = useState(false); // Global slow internet / data-saver mode
  const [activeSlotTarget, setActiveSlotTarget] = useState(null); // which slot drawer is targeting
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [focusSlotIdx, setFocusSlotIdx] = useState(0); // In focus layout mode, which slot is enlarged

  // Matches fetching & filtering
  const [availableMatches, setAvailableMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSportFilter, setSelectedSportFilter] = useState('all');

  const arenaContainerRef = useRef(null);

  // Poll available matches
  const fetchMatches = async () => {
    try {
      setLoadingMatches(true);
      const res = await fetch('/api/matches', { cache: 'no-store' });
      const data = await res.json();
      if (data.matches) {
        setAvailableMatches(data.matches);
      }
    } catch (err) {
      console.error('Failed fetching matches for multistream:', err);
    } finally {
      setLoadingMatches(false);
    }
  };

  useEffect(() => {
    fetchMatches();
    const interval = setInterval(fetchMatches, 25000);
    return () => clearInterval(interval);
  }, []);

  const openDrawerForSlot = (slotIndex) => {
    setActiveSlotTarget(slotIndex);
    setDrawerOpen(true);
  };

  const selectMatchForSlot = (match, targetIndex = null) => {
    const slotIdx = targetIndex !== null ? targetIndex : (activeSlotTarget !== null ? activeSlotTarget : slots.findIndex(s => !s));
    const finalIdx = slotIdx === -1 ? 0 : slotIdx;

    const nextSlots = [...slots];
    nextSlots[finalIdx] = {
      id: match.id,
      title: match.title,
      sport: match.sport || 'football',
      tournament: match.tournament || 'Match Fixture',
      homeName: match.homeTeam?.name || 'Home',
      awayName: match.awayTeam?.name || 'Away',
      homeBadge: match.homeTeam?.badge,
      awayBadge: match.awayTeam?.badge,
      status: match.status || 'live',
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      currentMinute: match.currentMinute,
      timestamp: match.timestamp
    };

    setSlots(nextSlots);
    setDrawerOpen(false);
    setActiveSlotTarget(null);

    // If first stream loaded, give it audio focus
    if (focusedAudioIndex === null) {
      setFocusedAudioIndex(finalIdx);
    }
  };

  const removeSlot = (slotIndex) => {
    const nextSlots = [...slots];
    nextSlots[slotIndex] = null;
    setSlots(nextSlots);
    if (focusedAudioIndex === slotIndex) {
      // Find another active slot for audio
      const nextActiveIdx = nextSlots.findIndex(s => Boolean(s));
      setFocusedAudioIndex(nextActiveIdx !== -1 ? nextActiveIdx : null);
    }
  };

  const clearAllSlots = () => {
    setSlots([null, null, null, null]);
    setFocusedAudioIndex(null);
  };

  const toggleGlobalLowData = () => {
    setLowDataGlobal(prev => !prev);
  };

  const toggleArenaFullscreen = () => {
    if (!arenaContainerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      arenaContainerRef.current.requestFullscreen().catch(() => {});
    }
  };

  // Filter matches in drawer
  const filteredMatches = availableMatches.filter(m => {
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery = !query || 
      (m.title && m.title.toLowerCase().includes(query)) ||
      (m.homeTeam?.name && m.homeTeam.name.toLowerCase().includes(query)) ||
      (m.awayTeam?.name && m.awayTeam.name.toLowerCase().includes(query)) ||
      (m.tournament && m.tournament.toLowerCase().includes(query));

    const matchesSport = selectedSportFilter === 'all' || 
      (selectedSportFilter === 'live' ? m.status === 'live' : m.sport === selectedSportFilter);

    return matchesQuery && matchesSport;
  });

  const activeScreensCount = slots.filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#0d0c15] text-slate-100 flex flex-col font-sans pb-12">
      {/* Top Navigation & Controls Header */}
      <header className="sticky top-0 z-40 bg-[#141221]/95 backdrop-blur-md border-b border-white/10 px-4 py-3">
        <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Brand & Return Link */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold border border-white/10 transition-all group"
            >
              <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 text-purple-400 transition-transform" />
              <span>Dashboard</span>
            </Link>

            <div className="h-4 w-px bg-white/10 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-lg shadow-purple-600/30">
                <Layers className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                  <span>Hydra Multi-Stream</span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 hidden md:inline-block">
                    Arena v2
                  </span>
                </h1>
              </div>
            </div>
          </div>

          {/* Center: Layout Presets Switcher */}
          <div className="flex items-center bg-[#0d0c15] p-1 rounded-xl border border-white/10 shadow-inner">
            <button
              onClick={() => setLayoutMode('quad')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                layoutMode === 'quad'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="Quad View (2x2 Grid)"
            >
              <Grid2x2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Quad 2x2</span>
            </button>

            <button
              onClick={() => setLayoutMode('spotlight')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                layoutMode === 'spotlight'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="Spotlight View (1 Hero + 2 Stacked)"
            >
              <Sliders className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Spotlight</span>
            </button>

            <button
              onClick={() => setLayoutMode('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                layoutMode === 'split'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="Split View (2x1 Dual Feed)"
            >
              <Columns2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Split 2x1</span>
            </button>

            <button
              onClick={() => setLayoutMode('focus')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                layoutMode === 'focus'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="Focus View (1 Screen + Switcher)"
            >
              <Square className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Focus 1x1</span>
            </button>
          </div>

          {/* Right: Low-Data Mode Toggle, Clear, Add Fixture, Fullscreen */}
          <div className="flex items-center gap-2">
            {/* Global Low Data Saver Toggle (Slow internet optimizer) */}
            <button
              onClick={toggleGlobalLowData}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                lowDataGlobal
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
              }`}
              title="Low-Data Mode optimizes bandwidth for slow internet connections by streaming in low resolution (360p/SD)"
            >
              {lowDataGlobal ? <WifiOff className="h-3.5 w-3.5 text-emerald-400" /> : <Wifi className="h-3.5 w-3.5 text-slate-400" />}
              <span className="hidden md:inline">{lowDataGlobal ? 'Low Data (Active)' : 'Low Data Mode'}</span>
            </button>

            {/* Audio Master Status Pill */}
            {focusedAudioIndex !== null && slots[focusedAudioIndex] && (
              <div 
                onClick={() => setFocusedAudioIndex(null)}
                className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold cursor-pointer hover:bg-purple-500/25 transition-all"
                title="Click to Mute All"
              >
                <div className="flex items-center gap-0.5">
                  <span className="w-1 h-2 bg-purple-400 rounded-full animate-pulse" />
                  <span className="w-1 h-3.5 bg-purple-400 rounded-full animate-pulse delay-75" />
                  <span className="w-1 h-2 bg-purple-400 rounded-full animate-pulse delay-150" />
                </div>
                <span>Audio: Screen {focusedAudioIndex + 1}</span>
                <VolumeX className="h-3 w-3 text-purple-400 hover:text-white" />
              </div>
            )}

            {/* Add Match Fixture Button */}
            <button
              onClick={() => openDrawerForSlot(null)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Fixture</span>
            </button>

            {/* Clear All */}
            {activeScreensCount > 0 && (
              <button
                onClick={clearAllSlots}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-white/10 hover:border-red-500/30 text-xs font-bold transition-all cursor-pointer"
                title="Clear all active slots"
              >
                Clear
              </button>
            )}

            {/* Fullscreen Arena */}
            <button
              onClick={toggleArenaFullscreen}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 text-xs font-bold transition-all cursor-pointer"
              title="Fullscreen Arena Wall"
            >
              <Maximize className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Multi-Stream Display Arena */}
      <main 
        ref={arenaContainerRef}
        className="flex-1 w-full max-w-[1720px] mx-auto p-3 sm:p-5 flex flex-col justify-start"
      >
        {/* Audio Banner & Screens info */}
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-white font-extrabold uppercase tracking-wider text-[11px]">
              {activeScreensCount === 0 ? 'Empty Arena — Add Fixtures to Begin' : `${activeScreensCount}/4 Fixtures Mounted`}
            </span>
            {lowDataGlobal && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                🍃 Data-Saver Mode Active (Low Bandwidth)
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 hidden sm:block">
            Click any screen's audio badge to switch live sound focus
          </div>
        </div>

        {/* LAYOUT 1: QUAD (2x2 Grid) */}
        {layoutMode === 'quad' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 flex-1 min-h-[70vh]">
            {[0, 1, 2, 3].map((slotIdx) => (
              <div key={slotIdx} className="h-full min-h-[280px] sm:min-h-[340px] flex flex-col">
                <SlotCard
                  slotIndex={slotIdx}
                  slotData={slots[slotIdx]}
                  isAudioFocused={focusedAudioIndex === slotIdx}
                  onFocusAudio={() => setFocusedAudioIndex(slotIdx)}
                  onMuteAudio={() => setFocusedAudioIndex(null)}
                  onRemove={() => removeSlot(slotIdx)}
                  onOpenDrawer={() => openDrawerForSlot(slotIdx)}
                  lowDataGlobal={lowDataGlobal}
                />
              </div>
            ))}
          </div>
        )}

        {/* LAYOUT 2: SPOTLIGHT (1 Primary Large + 2 Secondary Stacked) */}
        {layoutMode === 'spotlight' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 flex-1 min-h-[75vh]">
            {/* Hero Main Screen (Slot 0) */}
            <div className="lg:col-span-2 min-h-[380px] sm:min-h-[500px] flex flex-col">
              <SlotCard
                slotIndex={0}
                slotData={slots[0]}
                isAudioFocused={focusedAudioIndex === 0}
                onFocusAudio={() => setFocusedAudioIndex(0)}
                onMuteAudio={() => setFocusedAudioIndex(null)}
                onRemove={() => removeSlot(0)}
                onOpenDrawer={() => openDrawerForSlot(0)}
                lowDataGlobal={lowDataGlobal}
                isSpotlightHero
              />
            </div>

            {/* Stacked Side Screens (Slot 1 & Slot 2) */}
            <div className="flex flex-col gap-3.5 min-h-[400px]">
              <div className="flex-1 min-h-[200px]">
                <SlotCard
                  slotIndex={1}
                  slotData={slots[1]}
                  isAudioFocused={focusedAudioIndex === 1}
                  onFocusAudio={() => setFocusedAudioIndex(1)}
                  onMuteAudio={() => setFocusedAudioIndex(null)}
                  onRemove={() => removeSlot(1)}
                  onOpenDrawer={() => openDrawerForSlot(1)}
                  lowDataGlobal={lowDataGlobal}
                />
              </div>
              <div className="flex-1 min-h-[200px]">
                <SlotCard
                  slotIndex={2}
                  slotData={slots[2]}
                  isAudioFocused={focusedAudioIndex === 2}
                  onFocusAudio={() => setFocusedAudioIndex(2)}
                  onMuteAudio={() => setFocusedAudioIndex(null)}
                  onRemove={() => removeSlot(2)}
                  onOpenDrawer={() => openDrawerForSlot(2)}
                  lowDataGlobal={lowDataGlobal}
                />
              </div>
            </div>
          </div>
        )}

        {/* LAYOUT 3: SPLIT (2x1 Dual Feed) */}
        {layoutMode === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 flex-1 min-h-[70vh]">
            {[0, 1].map((slotIdx) => (
              <div key={slotIdx} className="h-full min-h-[340px] sm:min-h-[460px] flex flex-col">
                <SlotCard
                  slotIndex={slotIdx}
                  slotData={slots[slotIdx]}
                  isAudioFocused={focusedAudioIndex === slotIdx}
                  onFocusAudio={() => setFocusedAudioIndex(slotIdx)}
                  onMuteAudio={() => setFocusedAudioIndex(null)}
                  onRemove={() => removeSlot(slotIdx)}
                  onOpenDrawer={() => openDrawerForSlot(slotIdx)}
                  lowDataGlobal={lowDataGlobal}
                />
              </div>
            ))}
          </div>
        )}

        {/* LAYOUT 4: FOCUS (1 Full Screen + Thumbnail Switcher) */}
        {layoutMode === 'focus' && (
          <div className="flex flex-col gap-3.5 flex-1 min-h-[75vh]">
            <div className="flex-1 min-h-[420px] sm:min-h-[580px] w-full flex flex-col">
              <SlotCard
                slotIndex={focusSlotIdx}
                slotData={slots[focusSlotIdx]}
                isAudioFocused={focusedAudioIndex === focusSlotIdx}
                onFocusAudio={() => setFocusedAudioIndex(focusSlotIdx)}
                onMuteAudio={() => setFocusedAudioIndex(null)}
                onRemove={() => removeSlot(focusSlotIdx)}
                onOpenDrawer={() => openDrawerForSlot(focusSlotIdx)}
                lowDataGlobal={lowDataGlobal}
              />
            </div>

            {/* Thumbnail Switcher for other 3 screens */}
            <div className="grid grid-cols-4 gap-3 bg-[#141221] p-3 rounded-2xl border border-white/10">
              {[0, 1, 2, 3].map((idx) => {
                const s = slots[idx];
                const isSelected = focusSlotIdx === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setFocusSlotIdx(idx);
                      if (slots[idx]) setFocusedAudioIndex(idx);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-purple-500 bg-purple-600/20 ring-1 ring-purple-500'
                        : 'border-white/10 bg-[#0d0c15] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-extrabold uppercase text-purple-400">
                        Screen {idx + 1}
                      </span>
                      {s && (
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                      )}
                    </div>
                    <div className="text-xs font-bold text-white truncate">
                      {s ? `${s.homeName} vs ${s.awayName}` : 'Empty Slot'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Slide-over Match Selector Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-md bg-[#141221] border-l border-white/10 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Tv className="h-4 w-4 text-purple-400" />
                  <span>Mount Fixture Stream</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {activeSlotTarget !== null ? `Selecting for Screen ${activeSlotTarget + 1}` : 'Select a live match to mount'}
                </p>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Search & Filters */}
            <div className="p-4 space-y-3 border-b border-white/10 bg-[#181627]/50">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search teams, tournament, or sport..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[#0d0c15] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
                />
              </div>

              {/* Sport Filter Chips / Dropdown */}
              <div className="sm:hidden">
                <select
                  value={selectedSportFilter}
                  onChange={(e) => setSelectedSportFilter(e.target.value)}
                  className="w-full bg-[#13121f] text-white border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                  aria-label="Filter by sport"
                >
                  {[
                    { id: 'all', label: 'All Sports' },
                    { id: 'live', label: '🔴 Live Now' },
                    { id: 'football', label: 'Football' },
                    { id: 'basketball', label: 'Basketball' },
                    { id: 'tennis', label: 'Tennis' },
                    { id: 'combat', label: 'Combat' },
                  ].map((f) => (
                    <option key={f.id} value={f.id} className="bg-[#13121f] text-white">
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 flex-wrap pb-1">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'live', label: '🔴 Live Now' },
                  { id: 'football', label: 'Football' },
                  { id: 'basketball', label: 'Basketball' },
                  { id: 'tennis', label: 'Tennis' },
                  { id: 'combat', label: 'Combat' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedSportFilter(f.id)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedSportFilter === f.id
                        ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                        : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Matches List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
              {loadingMatches ? (
                <div className="py-20 text-center space-y-3">
                  <RefreshCw className="h-6 w-6 text-purple-400 animate-spin mx-auto" />
                  <p className="text-xs text-slate-400 font-semibold">Scanning live verified feeds...</p>
                </div>
              ) : filteredMatches.length > 0 ? (
                filteredMatches.map((m) => {
                  const isMounted = slots.some(s => s && s.id === m.id);
                  return (
                    <div
                      key={m.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isMounted
                          ? 'border-purple-500/30 bg-purple-950/20 opacity-80'
                          : 'border-white/10 bg-[#181627] hover:border-purple-500/40 hover:bg-[#1d1a30]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {m.tournament || 'Match Fixture'}
                        </span>
                        {m.status === 'live' ? (
                          <div className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase text-red-400">Live</span>
                            {m.currentMinute && (
                              <span className="text-[10px] font-bold text-slate-400">({m.currentMinute})</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400">Upcoming</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-3 my-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{m.homeTeam?.name || 'Home'}</p>
                          <p className="text-xs font-bold text-white truncate mt-0.5">{m.awayTeam?.name || 'Away'}</p>
                        </div>
                        {m.status === 'live' && (
                          <div className="text-sm font-black text-white px-2 py-1 rounded-lg bg-black/40 border border-white/5 tabular-nums">
                            {m.homeScore ?? 0} - {m.awayScore ?? 0}
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-medium">
                          {isMounted ? 'Already mounted' : 'Ready to stream'}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {activeSlotTarget !== null ? (
                            <button
                              onClick={() => selectMatchForSlot(m, activeSlotTarget)}
                              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-purple-600/30"
                            >
                              Load to Screen {activeSlotTarget + 1}
                            </button>
                          ) : (
                            <div className="flex items-center gap-1">
                              {[0, 1, 2, 3].map((slotNumber) => (
                                <button
                                  key={slotNumber}
                                  onClick={() => selectMatchForSlot(m, slotNumber)}
                                  className="h-7 w-7 rounded-lg bg-white/5 hover:bg-purple-600 text-slate-300 hover:text-white text-[10px] font-black border border-white/10 transition-all cursor-pointer"
                                  title={`Mount to Screen ${slotNumber + 1}`}
                                >
                                  S{slotNumber + 1}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-20 text-center space-y-2">
                  <p className="text-xs font-bold text-slate-300">No match fixtures found</p>
                  <p className="text-[11px] text-slate-500">Try searching another tournament or sport filter.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Individual Slot Card Component */
function SlotCard({
  slotIndex,
  slotData,
  isAudioFocused,
  onFocusAudio,
  onMuteAudio,
  onRemove,
  onOpenDrawer,
  lowDataGlobal,
  isSpotlightHero = false,
}) {
  const [streams, setStreams] = useState([]);
  const [activeStreamIdx, setActiveStreamIdx] = useState(0);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hlsLevels, setHlsLevels] = useState([]);
  const [selectedResolution, setSelectedResolution] = useState('auto'); // 'auto' | '1080p' | '720p' | '480p' | '360p'
  const [resDropdownOpen, setResDropdownOpen] = useState(false);
  const [serverDropdownOpen, setServerDropdownOpen] = useState(false);
  const [isDirectHlsFromApi, setIsDirectHlsFromApi] = useState(false);

  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const slotContainerRef = useRef(null);

  // Resolve streams for this fixture
  useEffect(() => {
    if (!slotData?.id) {
      setStreams([]);
      setError(null);
      setResolving(false);
      setIsDirectHlsFromApi(false);
      return;
    }

    let isCancelled = false;
    const fetchStreams = async () => {
      setResolving(true);
      setError(null);
      try {
        const res = await fetch(`/api/streams/${slotData.id}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`Stream API status ${res.status}`);
        const data = await res.json();
        if (isCancelled) return;

        if (data.streams && data.streams.length > 0) {
          setStreams(data.streams);
          setActiveStreamIdx(0);
          if (data.isDirectHls) {
            setIsDirectHlsFromApi(true);
          }
        } else if (data.error) {
          setError(data.error);
        } else {
          setError('No active streaming feeds found for this match.');
        }
      } catch (err) {
        if (!isCancelled) setError('Could not resolve streaming servers.');
      } finally {
        if (!isCancelled) setResolving(false);
      }
    };

    fetchStreams();
    return () => {
      isCancelled = true;
    };
  }, [slotData?.id]);

  const activeStream = streams[activeStreamIdx] || streams[0];
  const rawTargetUrl = activeStream?.url || '';
  const proxiedTargetUrl = activeStream?.proxiedUrl || '';

  // Decode u parameter if proxiedUrl exists (since /api/stream-redirect encodes the destination)
  let decodedFromProxy = '';
  if (proxiedTargetUrl && proxiedTargetUrl.includes('/api/stream-redirect?u=')) {
    try {
      const matchU = proxiedTargetUrl.match(/[?&]u=([^&]+)/);
      if (matchU && matchU[1]) {
        decodedFromProxy = atob(matchU[1].replace(/-/g, '+').replace(/_/g, '/'));
      }
    } catch (e) {}
  }

  const effectiveRawUrl = rawTargetUrl || decodedFromProxy || '';

  const isDirectHls = Boolean(
    isDirectHlsFromApi ||
    effectiveRawUrl.includes('.m3u8') ||
    effectiveRawUrl.includes('.mpd') ||
    effectiveRawUrl.includes('/hls/') ||
    effectiveRawUrl.includes('.mp4') ||
    effectiveRawUrl.includes('playlist') ||
    effectiveRawUrl.includes('manifest') ||
    rawTargetUrl.includes('.m3u8') ||
    rawTargetUrl.includes('.mpd') ||
    rawTargetUrl.includes('/hls/') ||
    rawTargetUrl.includes('.mp4') ||
    proxiedTargetUrl.includes('.m3u8')
  );

  const streamUrl = isDirectHls
    ? (effectiveRawUrl || rawTargetUrl || proxiedTargetUrl)
    : (proxiedTargetUrl || rawTargetUrl);

  // Setup HLS / Video playback
  useEffect(() => {
    if (!slotData || !isDirectHls || !streamUrl || !videoRef.current) return;
    const video = videoRef.current;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    video.muted = !isAudioFocused;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      const onLoadedMetadata = () => {
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      };
      video.addEventListener('loadedmetadata', onLoadedMetadata);
      return () => {
        video.removeEventListener('loadedmetadata', onLoadedMetadata);
      };
    } else if (Hls && Hls.isSupported()) {
      const hls = new Hls({
        maxBufferSize: 25 * 1024 * 1024,
        maxBufferLength: 20,
        liveSyncDuration: 3,
        enableWorker: true,
      });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (e, data) => {
        if (data?.levels && data.levels.length > 0) {
          const lvls = data.levels.map((lvl, index) => ({
            index,
            height: lvl.height,
            bitrate: lvl.bitrate,
            label: lvl.height ? `${lvl.height}p` : `${Math.round(lvl.bitrate / 1000)}k`,
          }));
          setHlsLevels(lvls);
        }
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [slotData?.id, streamUrl, isDirectHls]);

  // Sync audio mute state based on audio focus
  useEffect(() => {
    if (!slotData) return;
    if (videoRef.current) {
      videoRef.current.muted = !isAudioFocused;
      if (isAudioFocused && videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [slotData, isAudioFocused]);

  // Apply Resolution / Low Data Mode change
  const applyResolution = (res) => {
    setSelectedResolution(res);
    setResDropdownOpen(false);

    if (hlsRef.current) {
      if (res === 'auto') {
        hlsRef.current.currentLevel = -1;
      } else {
        const levelIdx = parseInt(res, 10);
        if (!isNaN(levelIdx) && levelIdx >= 0) {
          hlsRef.current.currentLevel = levelIdx;
        } else if (res === 'low' || res === '360p' || res === '480p') {
          hlsRef.current.currentLevel = 0; // lowest bitrate for slow internet
        } else if (res === '1080p' || res === 'high') {
          hlsRef.current.currentLevel = hlsLevels.length > 0 ? hlsLevels.length - 1 : -1;
        }
      }
    } else {
      // For multi-server stream channels (iframe): automatically select SD server for low bandwidth
      if (res === '360p' || res === '480p' || res === 'low') {
        const sdIndex = streams.findIndex(c => (c.quality || '').toLowerCase() === 'sd');
        if (sdIndex !== -1 && sdIndex !== activeStreamIdx) {
          setActiveStreamIdx(sdIndex);
        }
      } else if (res === '1080p' || res === '720p' || res === 'high') {
        const hdIndex = streams.findIndex(c => (c.quality || '').toLowerCase().includes('hd') || (c.quality || '').toLowerCase().includes('1080'));
        if (hdIndex !== -1 && hdIndex !== activeStreamIdx) {
          setActiveStreamIdx(hdIndex);
        }
      }
    }
  };

  // Sync with global low-data mode
  useEffect(() => {
    if (!slotData) return;
    if (lowDataGlobal) {
      applyResolution('360p');
    } else if (selectedResolution === '360p' && !lowDataGlobal) {
      applyResolution('auto');
    }
  }, [slotData, lowDataGlobal]);

  // If slotData is empty, show empty placeholder card AFTER ALL HOOKS
  if (!slotData) {
    return (
      <div 
        onClick={onOpenDrawer}
        className="w-full h-full min-h-[260px] rounded-2xl border-2 border-dashed border-white/10 hover:border-purple-500/40 bg-[#141221]/50 hover:bg-[#181627] flex flex-col items-center justify-center p-6 text-center cursor-pointer group transition-all duration-300"
      >
        <div className="h-12 w-12 rounded-2xl bg-purple-600/10 border border-purple-500/20 group-hover:scale-110 group-hover:bg-purple-600/25 flex items-center justify-center text-purple-400 transition-all shadow-inner mb-3">
          <Plus className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-extrabold text-white">Screen Slot {slotIndex + 1}</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Click to mount a live fixture stream into this viewport.
        </p>
        <span className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 group-hover:bg-purple-600 text-[11px] font-bold text-slate-300 group-hover:text-white transition-all">
          Browse Fixtures
        </span>
      </div>
    );
  }

  const toggleSlotFullscreen = () => {
    if (!slotContainerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      slotContainerRef.current.requestFullscreen().catch(() => {});
    }
  };

  const reloadStream = () => {
    if (isDirectHls && hlsRef.current) {
      hlsRef.current.startLoad();
    } else {
      const current = activeStreamIdx;
      setActiveStreamIdx(-1);
      setTimeout(() => setActiveStreamIdx(current), 100);
    }
  };

  return (
    <div
      ref={slotContainerRef}
      className={`relative w-full h-full rounded-2xl overflow-hidden bg-[#0a0910] border flex flex-col group transition-all duration-300 shadow-xl ${
        isAudioFocused ? 'border-purple-500/80 ring-1 ring-purple-500/50' : 'border-white/10 hover:border-white/20'
      }`}
    >
      {/* Top HUD Control Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-[#0d0c15]/90 via-[#0d0c15]/60 to-transparent p-2.5 flex items-center justify-between gap-2 select-none">
        {/* Match Info & Status */}
        <div className="flex items-center gap-2 min-w-0 max-w-[55%]">
          <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-600/40 text-purple-200 border border-purple-500/30 shrink-0">
            S{slotIndex + 1}
          </span>
          <div className="truncate">
            <span className="text-xs font-bold text-white truncate drop-shadow">
              {slotData.homeName} vs {slotData.awayName}
            </span>
            {slotData.tournament && (
              <span className="text-[10px] text-slate-400 font-medium ml-1.5 hidden sm:inline">
                ({slotData.tournament})
              </span>
            )}
          </div>
        </div>

        {/* Controls: Audio Focus, Server Selector, Resolution, Slot Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Audio Focus Toggle Button */}
          <button
            onClick={isAudioFocused ? onMuteAudio : onFocusAudio}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
              isAudioFocused
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/40 ring-1 ring-purple-400'
                : 'bg-black/60 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10'
            }`}
            title={isAudioFocused ? 'Audio Focused (Click to mute)' : 'Click to Focus Audio (mutes other screens)'}
          >
            {isAudioFocused ? (
              <>
                <Volume2 className="h-3 w-3 text-white" />
                <span className="hidden sm:inline">Audio Live</span>
              </>
            ) : (
              <>
                <VolumeX className="h-3 w-3 text-slate-400" />
                <span className="hidden sm:inline">Muted</span>
              </>
            )}
          </button>

          {/* Server Selector Dropdown */}
          {streams.length > 0 && (
            <div className="relative">
              <button
                onClick={() => {
                  setServerDropdownOpen(!serverDropdownOpen);
                  setResDropdownOpen(false);
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 hover:bg-white/10 border border-white/10 text-white text-[10px] font-extrabold uppercase transition-all"
                title="Select Streaming Server"
              >
                <span>Server {activeStreamIdx + 1}</span>
                <ChevronDown className="h-2.5 w-2.5 text-slate-400" />
              </button>

              {serverDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-32 bg-[#141221] border border-white/10 rounded-xl shadow-2xl py-1 z-30">
                  <div className="px-2 py-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-white/5">
                    Stream Servers
                  </div>
                  {streams.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setActiveStreamIdx(idx);
                        setServerDropdownOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 text-left text-[11px] font-bold flex items-center justify-between hover:bg-white/5 transition-colors ${
                        activeStreamIdx === idx ? 'text-purple-400' : 'text-slate-200'
                      }`}
                    >
                      <span>Server {idx + 1}</span>
                      <span className="text-[9px] px-1 py-0.5 rounded bg-white/5 text-slate-400">
                        {s.quality || 'SD'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Resolution Selector Dropdown (Slow Internet Optimizer) */}
          <div className="relative">
            <button
              onClick={() => {
                setResDropdownOpen(!resDropdownOpen);
                setServerDropdownOpen(false);
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-extrabold uppercase transition-all ${
                selectedResolution === '360p' || selectedResolution === '480p' || lowDataGlobal
                  ? 'bg-emerald-950/70 text-emerald-400 border-emerald-500/30'
                  : 'bg-black/60 text-white border-white/10 hover:bg-white/10'
              }`}
              title="Change Resolution / Bandwidth Saver"
            >
              <span>{selectedResolution === 'auto' ? 'Auto' : selectedResolution}</span>
              <ChevronDown className="h-2.5 w-2.5 text-slate-400" />
            </button>

            {resDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-36 bg-[#141221] border border-white/10 rounded-xl shadow-2xl py-1 z-30">
                <div className="px-2 py-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-white/5">
                  Resolution / Speed
                </div>

                <button
                  onClick={() => applyResolution('auto')}
                  className={`w-full px-2.5 py-1.5 text-left text-[11px] font-bold flex items-center justify-between hover:bg-white/5 ${
                    selectedResolution === 'auto' ? 'text-purple-400' : 'text-slate-200'
                  }`}
                >
                  <span>Auto (Adaptive)</span>
                  {selectedResolution === 'auto' && <Check className="h-3 w-3" />}
                </button>

                {hlsLevels.length > 0 ? (
                  hlsLevels.map((lvl) => (
                    <button
                      key={lvl.index}
                      onClick={() => applyResolution(lvl.index.toString())}
                      className={`w-full px-2.5 py-1.5 text-left text-[11px] font-bold flex items-center justify-between hover:bg-white/5 ${
                        selectedResolution === lvl.index.toString() ? 'text-purple-400' : 'text-slate-200'
                      }`}
                    >
                      <span>{lvl.label}</span>
                      {selectedResolution === lvl.index.toString() && <Check className="h-3 w-3" />}
                    </button>
                  ))
                ) : (
                  <>
                    <button
                      onClick={() => applyResolution('1080p')}
                      className={`w-full px-2.5 py-1.5 text-left text-[11px] font-bold flex items-center justify-between hover:bg-white/5 ${
                        selectedResolution === '1080p' ? 'text-purple-400' : 'text-slate-200'
                      }`}
                    >
                      <span>1080p HD</span>
                      {selectedResolution === '1080p' && <Check className="h-3 w-3" />}
                    </button>
                    <button
                      onClick={() => applyResolution('720p')}
                      className={`w-full px-2.5 py-1.5 text-left text-[11px] font-bold flex items-center justify-between hover:bg-white/5 ${
                        selectedResolution === '720p' ? 'text-purple-400' : 'text-slate-200'
                      }`}
                    >
                      <span>720p HD</span>
                      {selectedResolution === '720p' && <Check className="h-3 w-3" />}
                    </button>
                    <button
                      onClick={() => applyResolution('480p')}
                      className={`w-full px-2.5 py-1.5 text-left text-[11px] font-bold flex items-center justify-between hover:bg-white/5 ${
                        selectedResolution === '480p' ? 'text-emerald-400' : 'text-slate-200'
                      }`}
                    >
                      <span>480p (Fast)</span>
                      {selectedResolution === '480p' && <Check className="h-3 w-3" />}
                    </button>
                    <button
                      onClick={() => applyResolution('360p')}
                      className={`w-full px-2.5 py-1.5 text-left text-[11px] font-bold flex items-center justify-between hover:bg-white/5 ${
                        selectedResolution === '360p' ? 'text-emerald-400' : 'text-slate-200'
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        <span>360p (Low Data)</span>
                      </span>
                      {selectedResolution === '360p' && <Check className="h-3 w-3" />}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Swap Fixture button */}
          <button
            onClick={onOpenDrawer}
            className="p-1 rounded-lg bg-black/60 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
            title="Swap Match Fixture"
          >
            <Shuffle className="h-3 w-3" />
          </button>

          {/* Close/Remove Slot */}
          <button
            onClick={onRemove}
            className="p-1 rounded-lg bg-black/60 hover:bg-red-600 text-slate-300 hover:text-white border border-white/10 transition-colors"
            title="Unmount Slot"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Stream Video / Frame Body */}
      <div className="flex-1 w-full bg-black relative flex items-center justify-center overflow-hidden">
        {resolving ? (
          <div className="flex flex-col items-center justify-center space-y-2 p-6">
            <RefreshCw className="h-6 w-6 text-purple-400 animate-spin" />
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Connecting Feed...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-2 max-w-sm">
            <ShieldAlert className="h-6 w-6 text-amber-400" />
            <p className="text-xs font-bold text-slate-200">Stream Currently Unavailable</p>
            <p className="text-[11px] text-slate-400">{error}</p>
            <button
              onClick={onOpenDrawer}
              className="mt-2 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md"
            >
              Choose Alternative Fixture
            </button>
          </div>
        ) : isDirectHls ? (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-contain cursor-pointer bg-black"
            playsInline
            autoPlay
            muted={!isAudioFocused}
            onClick={() => {
              if (videoRef.current) {
                if (videoRef.current.paused) {
                  videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
                } else {
                  videoRef.current.pause();
                  setIsPlaying(false);
                }
              }
            }}
          />
        ) : activeStreamIdx === -1 ? (
          <div className="flex items-center justify-center">
            <RefreshCw className="h-5 w-5 text-slate-400 animate-spin" />
          </div>
        ) : (
          <iframe
            key={streamUrl}
            src={streamUrl}
            className="absolute inset-0 h-full w-full border-0"
            allowFullScreen
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          />
        )}

        {/* Low Data Mode Active Pill */}
        {(selectedResolution === '360p' || selectedResolution === '480p' || lowDataGlobal) && (
          <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
            <div className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-[9px] font-bold flex items-center gap-1 shadow-md">
              <WifiOff className="h-2.5 w-2.5 text-emerald-400" />
              <span>Low-Data Active</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom HUD Controls on Hover */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-[#0d0c15]/90 via-[#0d0c15]/50 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
        <div className="flex items-center gap-2">
          {/* Reload feed */}
          <button
            onClick={reloadStream}
            className="p-1.5 rounded-lg bg-black/60 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            title="Reload Video Stream"
          >
            <RefreshCw className="h-3 w-3" />
          </button>

          {/* Audio focus switch */}
          <button
            onClick={isAudioFocused ? onMuteAudio : onFocusAudio}
            className="p-1.5 rounded-lg bg-black/60 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            title={isAudioFocused ? 'Mute Audio' : 'Unmute & Focus Audio'}
          >
            {isAudioFocused ? <Volume2 className="h-3 w-3 text-purple-400" /> : <VolumeX className="h-3 w-3 text-slate-400" />}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Fullscreen Slot */}
          <button
            onClick={toggleSlotFullscreen}
            className="p-1.5 rounded-lg bg-black/60 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            title="Fullscreen Screen"
          >
            <Maximize className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
