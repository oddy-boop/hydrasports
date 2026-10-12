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
import { getCacheManager } from './cache/cacheManager';
import { getExternalMatchStats, getScoreForMatch } from './providers/scoreProvider';

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

    const uniqueMatches = Array.from(new Map(matches.map(match => [match.id, match])).values());

    if (uniqueMatches.length > 0) {
      const enriched = await Promise.all(uniqueMatches.map(async match => {
        if (match.homeScore !== null && match.awayScore !== null) return match;
        const eventId = match.id.match(/(\d+)$/)?.[1];
        if (match.status !== 'live' && match.status !== 'finished') return match;
        const score = await getScoreForMatch(
          match.title,
          match.timestamp,
          match.tournament,
          eventId,
          match.sport,
        );
        if (!score) return match;
        return {
          ...match,
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
