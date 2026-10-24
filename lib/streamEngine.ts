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
  const listedMatch = matches.find(match => match.id === matchId);
  if (listedMatch) return listedMatch;

  return getWatchFootyMatchDetails(matchId);
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
    const watchFooty = providers.find(p => p.id === 'watchfooty') as WatchFootyProvider;
    if (watchFooty) matches.push(...await watchFooty.fetchMatches());
    const fallbackMatches = await Promise.all(
      providers.filter(p => p.id !== 'watchfooty').map(provider => provider.fetchMatches()),
    );
    matches.push(...fallbackMatches.flat());

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
        mergedList[existingIdx] = {
          ...existing,
          homeScore: existing.homeScore ?? match.homeScore,
          awayScore: existing.awayScore ?? match.awayScore,
          currentMinute: existing.currentMinute || match.currentMinute,
          status: (match.status === 'live' || existing.status === 'live') ? 'live' : (match.status === 'finished' ? 'finished' : existing.status),
          homeTeam: {
            name: existing.homeTeam.name || match.homeTeam.name,
            badge: existing.homeTeam.badge || match.homeTeam.badge,
          },
          awayTeam: {
            name: existing.awayTeam.name || match.awayTeam.name,
            badge: existing.awayTeam.badge || match.awayTeam.badge,
          },
          sources: existing.sources.length > 0 ? existing.sources : match.sources,
          fallbackChannels: existing.fallbackChannels.length > 0 ? existing.fallbackChannels : match.fallbackChannels,
        };
      } else {
        mergedList.push(match);
      }
    }

    if (mergedList.length > 0) {
      const enriched = await Promise.all(mergedList.map(async match => {
        // If score is already populated, no need to re-fetch
        if (match.homeScore !== null && match.awayScore !== null) return match;

        // Enrich matches that are live, finished, or scheduled for today
        const isToday = Math.abs(Date.now() - match.timestamp) < 24 * 3600 * 1000;
        if (match.status !== 'live' && match.status !== 'finished' && !isToday) return match;

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

    const qualityOrder: Record<string, number> = { 'FHD': 0, 'HD': 0, '1080p': 0, '720p': 1, 'SD': 2 };
    allServers.sort((a, b) => (qualityOrder[a.quality || 'SD'] || 2) - (qualityOrder[b.quality || 'SD'] || 2));

    const seenUrls = new Set<string>();
    const uniqueServers: Channel[] = [];
    let serverIndex = 1;

    for (const server of allServers) {
      if (!seenUrls.has(server.url)) {
        seenUrls.add(server.url);
        uniqueServers.push({
          ...server,
          name: `Server ${serverIndex++}`,
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
