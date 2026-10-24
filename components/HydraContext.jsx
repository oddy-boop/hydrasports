'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const HydraSportsContext = createContext(null);

export function HydraProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const [activeMenu, setActiveMenu] = useState('live');
  const [activeSport, setActiveSport] = useState('Football');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('All');
  const [favouriteTeams, setFavouriteTeams] = useState(['Arsenal', 'Real Madrid']);
  const [menuTrigger, setMenuTrigger] = useState(0);

  // Active stream or featured match state
  const [activeMatch, setActiveMatch] = useState(null);

  const [volume, setVolume] = useState(85);
  const [isMuted, setIsMuted] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadActiveMatch = async () => {
      try {
        const response = await fetch('/api/matches', { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        const matches = Array.isArray(data.matches) ? data.matches : [];
        const candidate = matches.find(match => match.status === 'live') ||
          matches.find(match => match.status === 'upcoming');
        if (!cancelled && candidate) playMatch(candidate);
      } catch {
        // The dashboard remains usable without a selected match.
      }
    };

    loadActiveMatch();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activeMatch?.id || activeMatch.status !== 'live') return;

    let cancelled = false;
    const refreshActiveMatch = async () => {
      try {
        const response = await fetch(`/api/match/${activeMatch.id}`, { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        if (cancelled || !data.match) return;
        const match = data.match;
        setActiveMatch(previous => previous ? {
          ...previous,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          currentMinute: match.currentMinute,
          status: match.status,
          homeBadge: match.homeTeam?.badge || previous.homeBadge,
          awayBadge: match.awayTeam?.badge || previous.awayBadge,
        } : previous);
      } catch {
        // Keep the last confirmed match state when a refresh fails.
      }
    };

    refreshActiveMatch();
    const interval = setInterval(refreshActiveMatch, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeMatch?.id, activeMatch?.status]);

  useEffect(() => {
    const routeMenu = {
      '/': 'live',
      '/explore': 'explore',
      '/schedule': 'schedule',
      '/results': 'results',
      '/competitions': 'competitions',
      '/favourites': 'favourites',
    };
    if (routeMenu[pathname]) setActiveMenu(routeMenu[pathname]);
  }, [pathname]);

  // Load saved favourites from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('HydraSports_favourite_teams');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFavouriteTeams(parsed);
        }
      }
    } catch {}
  }, []);

  // Save favourites
  const toggleFavourite = useCallback((teamName) => {
    if (!teamName) return;
    setFavouriteTeams((prev) => {
      const exists = prev.includes(teamName);
      const updated = exists ? prev.filter((t) => t !== teamName) : [...prev, teamName];
      try {
        localStorage.setItem('HydraSports_favourite_teams', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  // Sidebar Menu button handler
  const selectMenu = useCallback((menuId) => {
    setActiveMenu(menuId);
    setMenuTrigger(Date.now());
    setSidebarOpen(false);

    // If on a subpage (e.g. /watch/... or /multistream), navigate back to home!
    router.push(menuId === 'live' ? '/' : `/${menuId}`);
  }, [pathname, router]);

  // Sidebar League button handler
  const selectLeague = useCallback((leagueId) => {
    setSelectedLeague((prev) => (prev === leagueId ? 'All' : leagueId));
    setActiveMenu('explore');
    setMenuTrigger(Date.now());
    setSidebarOpen(false);

    // If on a subpage, navigate back to home!
    router.push(`/competitions?league=${encodeURIComponent(leagueId)}`);
  }, [pathname, router]);

  const playMatch = useCallback((match) => {
    if (!match || match.status === 'finished') {
      setActiveMatch(null);
      return;
    }

    setActiveMatch({
      id: match.id,
      title: match.title,
      tournament: match.tournament || 'Live Match',
      homeName: match.homeTeam?.name || 'Home Team',
      awayName: match.awayTeam?.name || 'Away Team',
      homeBadge: match.homeTeam?.badge || '',
      awayBadge: match.awayTeam?.badge || '',
      homeScore: match.homeScore ?? (match.status === 'live' ? 0 : null),
      awayScore: match.awayScore ?? (match.status === 'live' ? 0 : null),
      currentMinute: match.currentMinute || (match.status === 'live' ? '45' : ''),
      status: match.status || 'live',
      sourcesCount: match.sources?.length || 2,
      latency: '0.8s',
      isStreaming: true,
    });
  }, []);

  const toggleStream = useCallback(() => {
    setActiveMatch((prev) => (
      prev && prev.status !== 'finished'
        ? { ...prev, isStreaming: !prev.isStreaming }
        : prev
    ));
  }, []);

  return (
    <HydraSportsContext.Provider
      value={{
        activeMenu,
        setActiveMenu,
        selectMenu,
        activeSport,
        setActiveSport,
        searchQuery,
        setSearchQuery,
        selectedLeague,
        setSelectedLeague,
        selectLeague,
        favouriteTeams,
        toggleFavourite,
        menuTrigger,
        activeMatch,
        setActiveMatch,
        playMatch,
        toggleStream,
        volume,
        setVolume,
        isMuted,
        setIsMuted,
        sidebarOpen,
        setSidebarOpen,
      }}
    >
      {children}
    </HydraSportsContext.Provider>
  );
}

export function useHydra() {
  const context = useContext(HydraSportsContext);
  if (!context) {
    throw new Error('useHydra / useHydraSports must be used within a HydraProvider');
  }
  return context;
}

export const useHydraSports = useHydra;
