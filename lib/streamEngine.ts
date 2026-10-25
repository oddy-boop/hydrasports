import crypto from 'crypto';
import logger from './logger';
import { Match, Channel } from './types';
import {
  WatchFootyProvider,
  getMatchDetails as getWatchFootyMatchDetails,
  getMatchStats,
  getLeagues,
  getTopTeams,
} from './providers/watchFooty';
import { CdnLiveProvider } from './providers/cdnLive';
import { StreamedPkProvider } from './providers/streamedPk';
import { EspnScoreboardProvider } from './providers/espnScoreboardProvider';
import { getCacheManager } from './cache/cacheManager';
import { getExternalMatchStats, getScoreForMatch } from './providers/scoreProvider';
import { teamsMatch } from './utils/matching';
import { cleanTeamBadgeUrl, getTeamLeague } from './utils/teamLogos';
import { extractDirectM3u8FromEmbed } from './utils/m3u8Extractor';

const SECRET_KEY = process.env.STREAM_SECRET || 'default_stream_hmac_secret_key_123_abc';

export { getMatchStats, getLeagues, getTopTeams };

export async function getMatchStatsForMatch(match: Match) {
  if (match.sport === 'football') {
    const watchFootyStats = await getMatchStats(match.id);
    if (watchFootyStats) return watchFootyStats;
  }

  const externalStats = await getExternalMatchStats(
    match.title,
    match.timestamp,
    match.tournament,
    match.sport,
  );
  if (!externalStats) return null;

  return {
    venue: match.venue,
    leagueLogo: match.leagueLogo,
    poster: match.poster,
    boxscore: externalStats.boxscore,
    rosters: externalStats.rosters,
    commentary: externalStats.commentary,
  };
}

export async function getLiveMatchDetails(matchId: string): Promise<Match | null> {
  const match = await getMatchDetails(matchId);
  if (!match || match.status !== 'live') return match;

  const eventId = match.id.match(/(\d+)$/)?.[1];
  const score = await getScoreForMatch(match.title, match.timestamp, match.tournament, eventId, match.sport);
  return score ? {
    ...match,
    homeScore: score.home,
    awayScore: score.away,
    currentMinute: score.currentMinute || match.currentMinute,
  } : match;
}

const providers = [
  new WatchFootyProvider(),
  new CdnLiveProvider(),
  new StreamedPkProvider(),
  new EspnScoreboardProvider(),
];

export async function getMatchDetails(matchId: string): Promise<Match | null> {
  const matches = await getMatches();
  const listedMatch = matches.find(match =>
    match.id === matchId ||
    match.id.toLowerCase() === matchId.toLowerCase() ||
    (match.mergedIds && match.mergedIds.includes(matchId))
  );
  if (listedMatch) return listedMatch;

  // Try directly from StreamedPkProvider in case of partial cached batch
  const streamed = providers.find(p => p.id === 'streamed') as StreamedPkProvider;
  if (streamed) {
    try {
      const streamedMatches = await streamed.fetchMatches();
      const sMatch = streamedMatches.find(m => m.id === matchId || m.id.toLowerCase() === matchId.toLowerCase());
      if (sMatch) return sMatch;
    } catch {}
  }

  // Try directly from EspnScoreboardProvider for tennis, basketball, hockey, or ESPN matches
  const espn = providers.find(p => p.id === 'espn') as EspnScoreboardProvider;
  if (espn) {
    try {
      const espnMatches = await espn.fetchMatches();
      const eMatch = espnMatches.find(m => m.id === matchId || m.id.toLowerCase() === matchId.toLowerCase());
      if (eMatch) {
        // Find if this eMatch was merged into a match in matches list
        const mergedInMatches = matches.find(m => m.sport === eMatch.sport && teamsMatch(m.title, eMatch.title));
        if (mergedInMatches) {
          return {
            ...mergedInMatches,
            id: matchId,
            sources: mergedInMatches.sources?.length > 0 ? mergedInMatches.sources : eMatch.sources,
          };
        }
        return eMatch;
      }
    } catch {}
  }

  const footyMatch = await getWatchFootyMatchDetails(matchId);
  if (footyMatch) return footyMatch;

  // Synthesize match structure from slug if match was routed directly
  if (matchId.includes('-vs-')) {
    const cleanSlug = matchId.replace(/-\d+$/, '');
    const parts = cleanSlug.split('-vs-');
    if (parts.length === 2) {
      const formatName = (s: string) => s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const homeName = formatName(parts[0]);
      const awayName = formatName(parts[1]);
      const title = `${homeName} vs ${awayName}`;

      let sport = 'football';
      const lowerSlug = matchId.toLowerCase();
      if (lowerSlug.includes('phoenix') || lowerSlug.includes('36ers') || lowerSlug.includes('nba') || lowerSlug.includes('basket') || lowerSlug.includes('kings') || lowerSlug.includes('taipans') || lowerSlug.includes('breakers') || lowerSlug.includes('jackjumpers') || lowerSlug.includes('wildcats')) {
        sport = 'basketball';
      } else if (lowerSlug.includes('hockey') || lowerSlug.includes('nhl') || lowerSlug.includes('penguins') || lowerSlug.includes('bruins') || lowerSlug.includes('leafs') || lowerSlug.includes('rangers')) {
        sport = 'hockey';
      } else if (lowerSlug.includes('tennis') || lowerSlug.includes('atp') || lowerSlug.includes('wta')) {
        sport = 'tennis';
      }

      return {
        id: matchId,
        title,
        sport,
        status: 'live',
        timestamp: Date.now(),
        tournament: sport === 'basketball' ? 'NBL' : 'Match Broadcast',
        country: 'Global',
        priority: 10,
        homeTeam: { name: homeName, badge: cleanTeamBadgeUrl(null, homeName, sport) },
        awayTeam: { name: awayName, badge: cleanTeamBadgeUrl(null, awayName, sport) },
        leagueLogo: '',
        poster: '',
        venue: '',
        note: '',
        provider: 'HydraSport',
        upstreamCategory: sport.charAt(0).toUpperCase() + sport.slice(1),
        popular: false,
        sources: [],
        fallbackChannels: [],
        homeScore: null,
        awayScore: null,
        currentMinute: 'Live',
        currentMinuteNumber: 0,
      };
    }
  }

  return null;
}

export function getStreamRedirectUrl(originalUrl: string): string {
  const encoded = Buffer.from(originalUrl).toString('base64url');
  const expires = Date.now() + 4 * 60 * 60 * 1000; // 4 hours expiration
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(`${encoded}:${expires}`)
    .digest('hex');
  return `/api/stream-redirect?u=${encoded}&expires=${expires}&sig=${signature}`;
}

export async function getMatches(): Promise<Match[]> {
  const cache = getCacheManager();
  return cache.swr('all_matches', async () => {
    let matches: Match[] = [];
    const providerResults = await Promise.allSettled(
      providers.map(p => p.fetchMatches())
    );
    for (const res of providerResults) {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        matches.push(...res.value);
      }
    }

    // Deduplicate and merge matches from different providers (Streamed, WatchFooty, ESPN)
    const mergedList: Match[] = [];

    for (const match of matches) {
      const existingIdx = mergedList.findIndex(existing => {
        if (existing.id === match.id) return true;
        if (existing.sport === match.sport && teamsMatch(existing.title, match.title)) return true;
        return false;
      });

      if (existingIdx !== -1) {
        // Merge match info: preserve stream sources from streaming provider, incorporate scores/badges from ESPN
        const existing = mergedList[existingIdx];
        const now = Date.now();
        const finalTimestamp = existing.timestamp || match.timestamp;
        const isFuture = Boolean(finalTimestamp && finalTimestamp > now + 60000);
        
        const resolvedStatus = isFuture
          ? 'upcoming'
          : (match.status === 'live' || existing.status === 'live')
          ? 'live'
          : (match.status === 'finished' || existing.status === 'finished')
          ? 'finished'
          : 'upcoming';

        const rawT = existing.tournament || match.tournament || '';
        const resolvedTournament = (
          !rawT || rawT.toLowerCase() === 'football' || rawT.toLowerCase() === 'match broadcast'
        )
          ? (getTeamLeague(existing.homeTeam.name || match.homeTeam.name) || getTeamLeague(existing.awayTeam.name || match.awayTeam.name) || rawT || 'League Match')
          : rawT;

        const currentMerged = existing.mergedIds || [existing.id];
        const newMerged = currentMerged.includes(match.id) ? currentMerged : [...currentMerged, match.id];

        mergedList[existingIdx] = {
          ...existing,
          mergedIds: newMerged,
          tournament: resolvedTournament,
          timestamp: finalTimestamp,
          homeScore: isFuture ? null : (existing.homeScore ?? match.homeScore),
          awayScore: isFuture ? null : (existing.awayScore ?? match.awayScore),
          currentMinute: isFuture ? '' : (existing.currentMinute || match.currentMinute),
          status: resolvedStatus,
          homeTeam: {
            name: existing.homeTeam.name || match.homeTeam.name,
            badge: cleanTeamBadgeUrl(match.homeTeam.badge || existing.homeTeam.badge, existing.homeTeam.name || match.homeTeam.name, match.sport || existing.sport),
          },
          awayTeam: {
            name: existing.awayTeam.name || match.awayTeam.name,
            badge: cleanTeamBadgeUrl(match.awayTeam.badge || existing.awayTeam.badge, existing.awayTeam.name || match.awayTeam.name, match.sport || existing.sport),
          },
          sources: existing.sources.length > 0 ? existing.sources : match.sources,
          fallbackChannels: existing.fallbackChannels.length > 0 ? existing.fallbackChannels : match.fallbackChannels,
        };
      } else {
        const now = Date.now();
        const isFuture = Boolean(match.timestamp && match.timestamp > now + 60000);
        const rawT = match.tournament || '';
        const resolvedTournament = (
          !rawT || rawT.toLowerCase() === 'football' || rawT.toLowerCase() === 'match broadcast'
        )
          ? (getTeamLeague(match.homeTeam.name) || getTeamLeague(match.awayTeam.name) || rawT || 'League Match')
          : rawT;

        const baseMatch = {
          ...match,
          tournament: resolvedTournament,
          homeTeam: {
            ...match.homeTeam,
            badge: cleanTeamBadgeUrl(match.homeTeam.badge, match.homeTeam.name, match.sport),
          },
          awayTeam: {
            ...match.awayTeam,
            badge: cleanTeamBadgeUrl(match.awayTeam.badge, match.awayTeam.name, match.sport),
          },
        };

        mergedList.push(isFuture ? {
          ...baseMatch,
          status: 'upcoming',
          homeScore: null,
          awayScore: null,
          currentMinute: '',
          currentMinuteNumber: 0,
        } : baseMatch);
      }
    }

    if (mergedList.length > 0) {
      const enriched = await Promise.all(mergedList.map(async match => {
        const now = Date.now();
        const isFuture = Boolean(match.timestamp && match.timestamp > now + 60000);

        if (isFuture) {
          return {
            ...match,
            status: 'upcoming' as const,
            homeScore: null,
            awayScore: null,
            currentMinute: '',
            currentMinuteNumber: 0,
          };
        }

        // If score is already populated, no need to re-fetch
        if (match.homeScore !== null && match.awayScore !== null) return match;

        // Only query external score provider for live or finished matches without score
        if (match.status !== 'live' && match.status !== 'finished') return match;

        const eventId = match.id.match(/(\d+)$/)?.[1];
        const score = await getScoreForMatch(
          match.title,
          match.timestamp,
          match.tournament,
          eventId,
          match.sport,
        );

        if (!score || (score.home === null && score.away === null)) return match;

        let status = match.status;
        if (score.currentMinute?.toLowerCase().includes('final')) {
          status = 'finished';
        } else if (score.currentMinute && (score.currentMinute.includes('Q') || score.currentMinute.includes('P') || score.currentMinute.includes("'") || score.currentMinute.toLowerCase().includes('in progress') || score.currentMinute.toLowerCase().includes('set'))) {
          status = 'live';
        }

        return {
          ...match,
          status,
          homeScore: score.home,
          awayScore: score.away,
          currentMinute: score.currentMinute || match.currentMinute,
          homeTeam: {
            ...match.homeTeam,
            badge: cleanTeamBadgeUrl(match.homeTeam?.badge, match.homeTeam?.name, match.sport),
          },
          awayTeam: {
            ...match.awayTeam,
            badge: cleanTeamBadgeUrl(match.awayTeam?.badge, match.awayTeam?.name, match.sport),
          },
        };
      }));
      return enriched;
    }

    return [];
  }, 15);
}

export async function getLiveMatches(): Promise<Match[]> {
  const matches = await getMatches();
  return matches.filter(m => m.status === 'live');
}

export async function resolveAllStreams(
  matchTitle: string,
  matchId: string,
  homeTeam: string,
  awayTeam: string,
  preFetchedMatch: Match | null = null
): Promise<{ url: string; proxiedUrl: string; channels: Channel[]; serverCount: number }> {
  const cache = getCacheManager();
  const cacheKey = `streams_${matchId}`;

  return cache.swr(cacheKey, async () => {
    const resolveTasks = providers.map(async provider => {
      try {
        return await provider.resolveStreams(matchTitle, homeTeam, awayTeam, matchId, preFetchedMatch);
      } catch (err) {
        logger.error(`Provider ${provider.name} failed resolving streams`, err, { matchId });
        return [];
      }
    });

    const results = await Promise.allSettled(resolveTasks);
    const allServers: Channel[] = [];

    for (const r of results) {
      if (r.status === 'fulfilled') {
        allServers.push(...r.value);
      }
    }

    // Also include fallbackChannels from preFetchedMatch if present
    if (preFetchedMatch?.fallbackChannels && preFetchedMatch.fallbackChannels.length > 0) {
      preFetchedMatch.fallbackChannels.forEach((ch, idx) => {
        allServers.push({
          name: ch.name || `Fallback Stream ${idx + 1}`,
          url: ch.url,
          provider: 'fallback',
          quality: 'HD',
        });
      });
    }

    if (allServers.length === 0) {
      throw new Error('No streams available from any provider');
    }

    // Tier 2: Real-time M3U8 Stream Extractor for any embed channels
    const embedServers = allServers.filter(s => 
      !s.url.includes('.m3u8') && 
      !s.url.includes('/hls/') && 
      !s.url.includes('.mpd') &&
      s.url.startsWith('http')
    );

    if (embedServers.length > 0) {
      const extractionTasks = embedServers.map(async (server) => {
        try {
          const directHlsUrl = await extractDirectM3u8FromEmbed(server.url);
          if (directHlsUrl && !allServers.some(s => s.url === directHlsUrl)) {
            return {
              name: `⚡ Direct 1-Click Stream (${server.quality || 'HD'})`,
              url: directHlsUrl,
              provider: 'hybrid-hls-extracted',
              quality: server.quality || 'HD',
            };
          }
        } catch {
          // Graceful fallback to embed
        }
        return null;
      });

      const extractedResults = await Promise.allSettled(extractionTasks);
      for (const res of extractedResults) {
        if (res.status === 'fulfilled' && res.value) {
          allServers.unshift(res.value);
        }
      }
    }

    // Rank 1: Direct HLS streams (containing .m3u8, .mpd, or /hls/) always prioritized first
    // Rank 2: Web embed backups
    const isDirect = (url: string) => url.includes('.m3u8') || url.includes('/hls/') || url.includes('.mpd');
    const qualityOrder: Record<string, number> = { 'FHD': 0, 'HD': 0, '1080p': 0, '720p': 1, 'SD': 2 };

    allServers.sort((a, b) => {
      const aDirect = isDirect(a.url) ? 0 : 1;
      const bDirect = isDirect(b.url) ? 0 : 1;
      if (aDirect !== bDirect) return aDirect - bDirect;
      return (qualityOrder[a.quality || 'SD'] || 2) - (qualityOrder[b.quality || 'SD'] || 2);
    });

    const seenUrls = new Set<string>();
    const uniqueServers: Channel[] = [];
    let serverIndex = 1;

    for (const server of allServers) {
      if (!seenUrls.has(server.url)) {
        seenUrls.add(server.url);
        const directHls = isDirect(server.url);
        const serverLabel = directHls
          ? `Server ${serverIndex++} (⚡ 1-Click HLS)`
          : `Server ${serverIndex++} (Web Backup)`;

        uniqueServers.push({
          ...server,
          name: serverLabel,
          proxiedUrl: getStreamRedirectUrl(server.url),
        });
      }
    }

    return {
      url: uniqueServers[0].url,
      proxiedUrl: uniqueServers[0].proxiedUrl || getStreamRedirectUrl(uniqueServers[0].url),
      channels: uniqueServers,
      serverCount: uniqueServers.length,
    };
  }, 30);
}
