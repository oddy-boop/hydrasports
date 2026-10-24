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
  shortName?: string;
  status?: { type?: { state?: string; shortDetail?: string; detail?: string } };
  competitions?: [{
    competitors?: Array<{
      homeAway?: string;
      score?: string;
      team?: {
        displayName?: string;
        name?: string;
        shortDisplayName?: string;
        location?: string;
      };
    }>;
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
  if (!tournament) return null;
  const league = tournament.toLowerCase().replace(/['’]/g, '');

  // ── UEFA Club Competitions ─────────────────────────────────────────────────
  if (
    league.includes('champions league') ||
    league.includes('champion league') ||
    league.includes('ucl') ||
    (league.includes('uefa') && league.includes('champion'))
  ) {
    return 'uefa.champions';
  }
  if (
    league.includes('europa league') ||
    league.includes('uel') ||
    (league.includes('uefa') && league.includes('europa') && !league.includes('conference'))
  ) {
    return 'uefa.europa';
  }
  if (league.includes('conference league') || league.includes('uecl') || league.includes('europa conference')) {
    return 'uefa.europa';
  }

  // ── Other Continental ─────────────────────────────────────────────────────
  if (league.includes('libertadores')) return 'conmebol.libertadores';
  if (league.includes('sudamericana')) return 'conmebol.sudamericana';
  if (league.includes('afc') && (league.includes('champion') || league.includes('elite'))) return 'afc.champions';
  if (league.includes('concacaf') && (league.includes('champion') || league.includes('cup'))) return 'concacaf.champions';

  // ── UEFA International / Nations ──────────────────────────────────────────
  if (league.includes('nations league'))
    return 'uefa.nations';
  if (league.includes('euro') && !league.includes('europa'))
    return 'uefa.euro';

  // ── Top Domestic Leagues ──────────────────────────────────────────────────
  if (league.includes('premier league') && !league.includes('saudi') && !league.includes('russian'))
    return 'eng.1';
  if (league.includes('championship') && league.includes('eng'))
    return 'eng.2';
  if (league.includes('la liga') || (league.includes('spain') && league.includes('primera')))
    return 'esp.1';
  if (league.includes('serie a') && !league.includes('serie b'))
    return 'ita.1';
  if (league.includes('serie b'))
    return 'ita.2';
  if ((league.includes('bundesliga') && !league.includes('austrian') && !league.includes('2. bundesliga')))
    return 'ger.1';
  if (league.includes('2. bundesliga'))
    return 'ger.2';
  if (league.includes('ligue 1'))
    return 'fra.1';
  if (league.includes('ligue 2'))
    return 'fra.2';
  if (league.includes('primeira liga') || league.includes('portuguese premier'))
    return 'por.1';
  if (league.includes('eredivisie'))
    return 'ned.1';
  if (league.includes('pro league') && league.includes('belg'))
    return 'bel.1';
  if (league.includes('scottish premiership'))
    return 'sco.1';
  if (league.includes('super lig') && league.includes('turk'))
    return 'tur.1';
  if (league.includes('superliga') && league.includes('rus'))
    return 'rus.1';
  if (league.includes('saudi pro') || (league.includes('saudi') && league.includes('league')))
    return 'sau.1';
  if (league.includes('mls'))
    return 'usa.1';
  if (league.includes('liga mx'))
    return 'mex.1';
  if (league.includes('brasileirao') || league.includes('serie a') && league.includes('brazil'))
    return 'bra.1';
  if (league.includes('argentina') && (league.includes('primera') || league.includes('liga profesional')))
    return 'arg.1';

  // ── Domestic Cups ────────────────────────────────────────────────────────
  if (league.includes('fa cup'))
    return 'eng.fa';
  if (league.includes('efl cup') || league.includes('carabao') || league.includes('league cup'))
    return 'eng.league_cup';
  if (league.includes('copa del rey'))
    return 'esp.copa_del_rey';
  if (league.includes('dfb') || (league.includes('german') && league.includes('cup')))
    return 'ger.dfb_pokal';
  if (league.includes('coppa italia'))
    return 'ita.coppa_italia';
  if (league.includes('coupe de france'))
    return 'fra.coupe_de_france';

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

function matchEspnEvent(title: string, event: EspnEvent): boolean {
  if (!event) return false;
  if (event.name && teamsMatch(title, event.name)) return true;
  if (event.shortName && teamsMatch(title, event.shortName)) return true;

  const comps = event.competitions?.[0]?.competitors || [];
  const home = comps.find(c => c.homeAway === 'home')?.team;
  const away = comps.find(c => c.homeAway === 'away')?.team;
  if (home && away) {
    const homeNames = [home.displayName, home.name, home.shortDisplayName, home.location].filter(Boolean) as string[];
    const awayNames = [away.displayName, away.name, away.shortDisplayName, away.location].filter(Boolean) as string[];
    for (const hn of homeNames) {
      for (const an of awayNames) {
        if (teamsMatch(title, `${hn} vs ${an}`)) return true;
      }
    }
  }
  return false;
}

async function fetchEspnEvents(sport: string, league: string, date?: string): Promise<EspnEvent[]> {
  const cacheKey = `${sport}:${league}:${date || 'current'}`;
  const cached = espnCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.events;

  const url = date
    ? `${ESPN_API}/${sport}/${league}/scoreboard?dates=${date}`
    : `${ESPN_API}/${sport}/${league}/scoreboard`;

  try {
    const data = await fetchWithTimeout(url, TIMEOUT_MS) as { events?: EspnEvent[] };
    const events = Array.isArray(data?.events) ? data.events : [];
    espnCache.set(cacheKey, { expiresAt: Date.now() + EVENTS_CACHE_TTL, events });
    return events;
  } catch (err) {
    return [];
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

  const date = timestamp ? new Date(timestamp).toISOString().slice(0, 10).replaceAll('-', '') : '';

  // 1. Try with date if available
  let events = date ? await fetchEspnEvents(config.sport, config.league, date) : [];
  let event = events.find(candidate => matchEspnEvent(title, candidate));

  // 2. If not found, try the current scoreboard without date (current round/matchday)
  if (!event) {
    const currentEvents = await fetchEspnEvents(config.sport, config.league);
    event = currentEvents.find(candidate => matchEspnEvent(title, candidate));
  }

  // 3. If still not found and timestamp is present, check adjacent days (timezone offset)
  if (!event && timestamp) {
    const prevDate = new Date(timestamp - 86400000).toISOString().slice(0, 10).replaceAll('-', '');
    const nextDate = new Date(timestamp + 86400000).toISOString().slice(0, 10).replaceAll('-', '');

    const prevEvents = await fetchEspnEvents(config.sport, config.league, prevDate);
    event = prevEvents.find(candidate => matchEspnEvent(title, candidate));

    if (!event) {
      const nextEvents = await fetchEspnEvents(config.sport, config.league, nextDate);
      event = nextEvents.find(candidate => matchEspnEvent(title, candidate));
    }
  }

  if (!event) return null;
  const competitors = event.competitions?.[0]?.competitors || [];
  const home = competitors.find(team => team.homeAway === 'home')?.score;
  const away = competitors.find(team => team.homeAway === 'away')?.score;
  return {
    home: home == null ? null : Number(home),
    away: away == null ? null : Number(away),
    currentMinute: event.competitions?.[0]?.status?.displayClock ||
      event.status?.type?.shortDetail ||
      event.status?.type?.detail || '',
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

  const date = timestamp ? new Date(timestamp).toISOString().slice(0, 10).replaceAll('-', '') : '';
  let events = date ? await fetchEspnEvents(config.sport, config.league, date) : [];
  let event = events.find(candidate => matchEspnEvent(title, candidate));

  if (!event) {
    const currentEvents = await fetchEspnEvents(config.sport, config.league);
    event = currentEvents.find(candidate => matchEspnEvent(title, candidate));
  }

  if (!event && timestamp) {
    const prevDate = new Date(timestamp - 86400000).toISOString().slice(0, 10).replaceAll('-', '');
    const nextDate = new Date(timestamp + 86400000).toISOString().slice(0, 10).replaceAll('-', '');

    const prevEvents = await fetchEspnEvents(config.sport, config.league, prevDate);
    event = prevEvents.find(candidate => matchEspnEvent(title, candidate));

    if (!event) {
      const nextEvents = await fetchEspnEvents(config.sport, config.league, nextDate);
      event = nextEvents.find(candidate => matchEspnEvent(title, candidate));
    }
  }

  return event || null;
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
    if (!espnScore && sport === 'football' && !getEspnLeague(tournament)) {
      espnScore = await getEspnScore(title, timestamp, 'uefa champions league', sport);
    }
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
