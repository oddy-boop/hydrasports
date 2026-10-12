import { fetchWithTimeout } from './baseProvider';
import { teamsMatch } from '../utils/matching';
import logger from '../logger';

const SCORE_API = 'https://www.thesportsdb.com/api/v1/json/3/eventsday.php';
const EVENT_SEARCH_API = 'https://www.thesportsdb.com/api/v1/json/3/searchevents.php';
const EVENT_LOOKUP_API = 'https://www.thesportsdb.com/api/v1/json/3/lookupevent.php';
const ESPN_API = 'https://site.api.espn.com/apis/site/v2/sports';
const STREAMED_MATCHES_API = 'https://streamed.pk/api/matches';
const TIMEOUT_MS = 4000;
const EVENTS_CACHE_TTL = 15_000;
const SEARCH_CACHE_TTL = 5 * 60_000;

interface ScoreEvent {
  strEvent?: string;
  strHomeTeam?: string;
  strAwayTeam?: string;
  intHomeScore?: string | null;
  intAwayScore?: string | null;
}

interface EspnEvent {
  id?: string;
  name?: string;
  status?: { type?: { state?: string; shortDetail?: string; detail?: string } };
  competitions?: [{
    competitors?: Array<{ homeAway?: string; score?: string }>;
    status?: { displayClock?: string };
  }];
}

interface ScoreResponse {
  events?: ScoreEvent[] | null;
}

interface SearchResponse {
  event?: ScoreEvent[] | null;
}

const eventsCache = new Map<string, { expiresAt: number; events: ScoreEvent[] }>();
const searchCache = new Map<string, { expiresAt: number; event: ScoreEvent | null }>();
const eventsInFlight = new Map<string, Promise<ScoreEvent[]>>();
const searchInFlight = new Map<string, Promise<ScoreEvent | null>>();
const espnCache = new Map<string, { expiresAt: number; events: EspnEvent[] }>();
const summaryCache = new Map<string, { expiresAt: number; stats: ExternalMatchStats }>();
const streamedScoreCache = new Map<string, { expiresAt: number; score: MatchScore | null }>();

function getSearchName(title: string): string {
  return title
    .split(/\s+(?:vs\.?|v)\s+/i)
    .map(team => team.trim())
    .join('_');
}

function parseScore(event: ScoreEvent): MatchScore {
  const home = event.intHomeScore == null ? null : Number(event.intHomeScore);
  const away = event.intAwayScore == null ? null : Number(event.intAwayScore);
  return {
    home: Number.isFinite(home) ? home : null,
    away: Number.isFinite(away) ? away : null,
  };
}

function getEspnLeague(tournament: string): string | null {
  const league = tournament.toLowerCase();
  if (league.includes('la liga')) return 'esp.1';
  if (league.includes('serie a')) return 'ita.1';
  if (league.includes('premier league')) return 'eng.1';
  if (league.includes('bundesliga')) return 'ger.1';
  if (league.includes('ligue 1')) return 'fra.1';
  return null;
}

function getEspnSportConfig(sport: string, tournament: string): { sport: string; league: string } | null {
  if (sport === 'basketball') return { sport: 'basketball', league: 'nba' };
  if (sport === 'hockey') return { sport: 'hockey', league: 'nhl' };
  if (sport === 'baseball') return { sport: 'baseball', league: 'mlb' };
  const league = getEspnLeague(tournament);
  return league ? { sport: 'soccer', league } : null;
}

async function getStreamedScore(
  title: string,
  timestamp: number,
  sport = 'football',
): Promise<MatchScore | null> {
  const cacheKey = `${sport}:${new Date(timestamp).toISOString().slice(0, 10)}`;
  const cached = streamedScoreCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.score;

  try {
    const data = await fetchWithTimeout(
      `${STREAMED_MATCHES_API}/${encodeURIComponent(sport)}`,
      TIMEOUT_MS,
    ) as Array<Record<string, any>>;
    const match = data.find(candidate => teamsMatch(title, candidate.title || ''));
    if (!match) {
      streamedScoreCache.set(cacheKey, { expiresAt: Date.now() + EVENTS_CACHE_TTL, score: null });
      return null;
    }
    const home = Number(match.homeScore ?? match.score?.home ?? match.scores?.home);
    const away = Number(match.awayScore ?? match.score?.away ?? match.scores?.away);
    const score = {
      home: Number.isFinite(home) ? home : null,
      away: Number.isFinite(away) ? away : null,
      currentMinute: match.currentMinute || match.status?.displayClock || match.status?.detail || '',
    };
    const result = score.home !== null && score.away !== null ? score : null;
    streamedScoreCache.set(cacheKey, { expiresAt: Date.now() + EVENTS_CACHE_TTL, score: result });
    return result;
  } catch (error) {
    logger.warn('Streamed.pk score provider unavailable', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

async function getEspnScore(
  title: string,
  timestamp: number,
  tournament: string,
  sport = 'football',
): Promise<MatchScore | null> {
  const config = getEspnSportConfig(sport, tournament);
  if (!config) return null;
  const date = new Date(timestamp).toISOString().slice(0, 10).replaceAll('-', '');
  const cacheKey = `${config.sport}:${config.league}:${date}`;
  let events = espnCache.get(cacheKey)?.events;
  if (!events || (espnCache.get(cacheKey)?.expiresAt || 0) <= Date.now()) {
    const data = await fetchWithTimeout(
      `${ESPN_API}/${config.sport}/${config.league}/scoreboard?dates=${date}`,
      TIMEOUT_MS,
    ) as { events?: EspnEvent[] };
    events = data.events || [];
    espnCache.set(cacheKey, { expiresAt: Date.now() + EVENTS_CACHE_TTL, events });
  }

  const event = events.find(candidate => teamsMatch(title, candidate.name || ''));
  if (!event) return null;
  const competitors = event.competitions?.[0]?.competitors || [];
  const home = competitors.find(team => team.homeAway === 'home')?.score;
  const away = competitors.find(team => team.homeAway === 'away')?.score;
  return {
    home: home == null ? null : Number(home),
    away: away == null ? null : Number(away),
    currentMinute: event.competitions?.[0]?.status?.displayClock ||
      event.status?.type?.shortDetail || '',
  };
}

async function getEventsForDate(date: string): Promise<ScoreEvent[]> {
  const cached = eventsCache.get(date);
  if (cached && cached.expiresAt > Date.now()) return cached.events;
  const inFlight = eventsInFlight.get(date);
  if (inFlight) return inFlight;

  const request = (async () => {
    try {
      const data = await fetchWithTimeout(
        `${SCORE_API}?d=${date}&s=Soccer`,
        TIMEOUT_MS,
      ) as ScoreResponse;
      const events = data.events || [];
      eventsCache.set(date, { expiresAt: Date.now() + EVENTS_CACHE_TTL, events });
      return events;
    } finally {
      eventsInFlight.delete(date);
    }
  })();
  eventsInFlight.set(date, request);
  return request;
}

async function searchEvent(title: string): Promise<ScoreEvent | null> {
  const query = getSearchName(title);
  const cached = searchCache.get(query);
  if (cached && cached.expiresAt > Date.now()) return cached.event;
  const inFlight = searchInFlight.get(query);
  if (inFlight) return inFlight;

  const request = (async () => {
    try {
      const data = await fetchWithTimeout(
        `${EVENT_SEARCH_API}?e=${encodeURIComponent(query)}`,
        TIMEOUT_MS,
      ) as SearchResponse;
      const event = (data.event || []).find(candidate => {
        const candidateTitle = candidate.strEvent ||
          `${candidate.strHomeTeam || ''} vs ${candidate.strAwayTeam || ''}`;
        return teamsMatch(title, candidateTitle);
      }) || null;
      searchCache.set(query, { expiresAt: Date.now() + SEARCH_CACHE_TTL, event });
      return event;
    } finally {
      searchInFlight.delete(query);
    }
  })();
  searchInFlight.set(query, request);
  return request;
}

export interface MatchScore {
  home: number | null;
  away: number | null;
  currentMinute?: string;
}

export interface ExternalMatchStats {
  boxscore: any;
  rosters: any;
  commentary: any[];
}

function normalizeEspnCommentary(summary: any): any[] {
  const events = Array.isArray(summary.keyEvents) ? summary.keyEvents : [];
  const commentary = Array.isArray(summary.commentary) ? summary.commentary : [];
  return [...events, ...commentary]
    .map((item: any) => ({
      type: item.type?.text || item.type?.type || 'commentary',
      minute: item.clock?.displayValue || item.time?.displayValue || '',
      text: item.text || item.shortText || item.description || '',
      team: item.team?.displayName || '',
      participants: (item.participants || item.athletes || []).map((participant: any, index: number) => ({
        name: participant.athlete?.displayName || participant.displayName || '',
        role: participant.role || (
          /substitution/i.test(item.type?.text || '') ? (index === 0 ? 'in' : 'out') :
          (/goal|penalty/i.test(item.type?.text || '') ? (index === 0 ? 'scorer' : 'assist') : '')
        ),
      })),
    }))
    .filter((item: any) => item.text || item.type !== 'commentary');
}

async function getEspnEvent(
  title: string,
  timestamp: number,
  tournament: string,
  sport = 'football',
): Promise<EspnEvent | null> {
  const config = getEspnSportConfig(sport, tournament);
  if (!config) return null;
  const date = new Date(timestamp).toISOString().slice(0, 10).replaceAll('-', '');
  const cacheKey = `${config.sport}:${config.league}:${date}`;
  let events = espnCache.get(cacheKey)?.events;
  if (!events || (espnCache.get(cacheKey)?.expiresAt || 0) <= Date.now()) {
    const data = await fetchWithTimeout(
      `${ESPN_API}/${config.sport}/${config.league}/scoreboard?dates=${date}`,
      TIMEOUT_MS,
    ) as { events?: EspnEvent[] };
    events = data.events || [];
    espnCache.set(cacheKey, { expiresAt: Date.now() + EVENTS_CACHE_TTL, events });
  }
  return events.find(event => teamsMatch(title, event.name || '')) || null;
}

export async function getExternalMatchStats(
  title: string,
  timestamp: number,
  tournament: string,
  sport = 'football',
): Promise<ExternalMatchStats | null> {
  try {
    const config = getEspnSportConfig(sport, tournament);
    if (!config) return null;
    const event = await getEspnEvent(title, timestamp, tournament, sport);
    if (!event?.id) return null;
    const cached = summaryCache.get(event.id);
    if (cached && cached.expiresAt > Date.now()) return cached.stats;
    const summary = await fetchWithTimeout(
      `${ESPN_API}/${config.sport}/${config.league}/summary?event=${event.id}`,
      TIMEOUT_MS,
    ) as any;
    const stats = {
      boxscore: summary.boxscore || null,
      rosters: summary.rosters || [],
      commentary: normalizeEspnCommentary(summary),
    };
    summaryCache.set(event.id, { expiresAt: Date.now() + EVENTS_CACHE_TTL, stats });
    return stats;
  } catch (error) {
    logger.warn('External match statistics unavailable', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function getScoreForMatch(
  title: string,
  timestamp: number,
  tournament = '',
  eventId?: string,
  sport = 'football',
): Promise<MatchScore | null> {
  const date = new Date(timestamp).toISOString().slice(0, 10);

  let espnScore: MatchScore | null = null;
  try {
    espnScore = await getEspnScore(title, timestamp, tournament, sport);
  } catch (error) {
    logger.warn('ESPN score provider unavailable', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
  if (espnScore) return espnScore;

  const streamedScore = await getStreamedScore(title, timestamp, sport);
  if (streamedScore) return streamedScore;

  try {
    if (eventId) {
      const data = await fetchWithTimeout(
        `${EVENT_LOOKUP_API}?id=${encodeURIComponent(eventId)}`,
        TIMEOUT_MS,
      ) as SearchResponse;
      const event = (data.event || []).find(candidate => {
        const candidateTitle = candidate.strEvent ||
          `${candidate.strHomeTeam || ''} vs ${candidate.strAwayTeam || ''}`;
        return teamsMatch(title, candidateTitle);
      });
      if (event) return parseScore(event);
    }

    let event: ScoreEvent | null = (await getEventsForDate(date)).find(candidate => {
      const candidateTitle = candidate.strEvent ||
        `${candidate.strHomeTeam || ''} vs ${candidate.strAwayTeam || ''}`;
      return teamsMatch(title, candidateTitle);
    }) || null;

    if (!event) {
      event = await searchEvent(title);
    }

    if (!event) return null;

    return parseScore(event);
  } catch (error) {
    logger.warn('Live score provider unavailable', { error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}
