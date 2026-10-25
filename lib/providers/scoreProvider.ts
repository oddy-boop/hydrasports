import { fetchWithTimeout } from './baseProvider';
import { teamsMatch, extractTeamNames, teamSimilarity } from '../utils/matching';
import logger from '../logger';

// Updated TheSportsDB key "123" (key 3 is permanently disabled)
const SCORE_API = 'https://www.thesportsdb.com/api/v1/json/123/eventsday.php';
const EVENT_SEARCH_API = 'https://www.thesportsdb.com/api/v1/json/123/searchevents.php';
const EVENT_LOOKUP_API = 'https://www.thesportsdb.com/api/v1/json/123/lookupevent.php';
const ESPN_API = 'https://site.api.espn.com/apis/site/v2/sports';
const STREAMED_MATCHES_API = 'https://streamed.pk/api/matches';
const TIMEOUT_MS = 4000;
const EVENTS_CACHE_TTL = 4_000; // Ultra-fast 4s cache for immediate goal updates
const SEARCH_CACHE_TTL = 5 * 60_000;

interface ScoreEvent {
  strEvent?: string;
  strHomeTeam?: string;
  strAwayTeam?: string;
  intHomeScore?: string | null;
  intAwayScore?: string | null;
}

interface EspnCompetitor {
  homeAway?: string;
  score?: string;
  winner?: boolean;
  linescores?: Array<{ value?: number; tiebreak?: number; winner?: boolean }>;
  team?: {
    displayName?: string;
    name?: string;
    shortDisplayName?: string;
    location?: string;
    abbreviation?: string;
  };
  athlete?: {
    displayName?: string;
    fullName?: string;
    shortName?: string;
  };
}

interface EspnEvent {
  id?: string;
  name?: string;
  shortName?: string;
  status?: { type?: { state?: string; shortDetail?: string; detail?: string; description?: string } };
  groupings?: Array<{
    grouping?: { displayName?: string };
    competitions?: Array<{
      id?: string;
      competitors?: EspnCompetitor[];
      status?: { type?: { state?: string; shortDetail?: string; detail?: string; description?: string } };
      notes?: Array<{ text?: string }>;
    }>;
  }>;
  competitions?: Array<{
    id?: string;
    competitors?: EspnCompetitor[];
    status?: { displayClock?: string; type?: { state?: string; shortDetail?: string; detail?: string; description?: string } };
    notes?: Array<{ text?: string }>;
  }>;
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

export function getEspnLeague(tournament: string): string | null {
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
  if (league.includes('mls') || league.includes('major league soccer'))
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

export function getEspnSportConfigs(sport: string, tournament: string): { sport: string; league: string }[] {
  const normSport = (sport || '').toLowerCase().replace(/[\s-_]+/g, '');

  if (normSport === 'basketball' || normSport === 'nba') {
    return [
      { sport: 'basketball', league: 'nbl' },
      { sport: 'basketball', league: 'nba' },
      { sport: 'basketball', league: 'mens-college-basketball' },
      { sport: 'basketball', league: 'womens-college-basketball' },
      { sport: 'basketball', league: 'wnba' },
    ];
  }

  if (normSport === 'hockey' || normSport === 'icehockey' || normSport === 'nhl') {
    return [
      { sport: 'hockey', league: 'nhl' },
      { sport: 'hockey', league: 'mens-college-hockey' },
    ];
  }

  if (normSport === 'tennis' || normSport === 'atp' || normSport === 'wta') {
    return [
      { sport: 'tennis', league: 'atp' },
      { sport: 'tennis', league: 'wta' },
    ];
  }

  if (normSport === 'baseball' || normSport === 'mlb') {
    return [{ sport: 'baseball', league: 'mlb' }];
  }

  const league = getEspnLeague(tournament);
  if (league) {
    return [{ sport: 'soccer', league }];
  }
  return [
    { sport: 'soccer', league: 'all' },
    { sport: 'soccer', league: 'eng.1' },
    { sport: 'soccer', league: 'esp.1' },
    { sport: 'soccer', league: 'ita.1' },
    { sport: 'soccer', league: 'ger.1' },
    { sport: 'soccer', league: 'fra.1' },
    { sport: 'soccer', league: 'uefa.champions' },
    { sport: 'soccer', league: 'usa.1' },
  ];
}

async function getStreamedScore(
  title: string,
  timestamp: number,
  sport = 'football',
): Promise<MatchScore | null> {
  const normSport = (sport || '').toLowerCase().replace(/[\s-_]+/g, '');
  const dayStr = timestamp ? new Date(timestamp).toISOString().slice(0, 10) : 'today';
  const cacheKey = `${normSport}:${title.toLowerCase().trim()}:${dayStr}`;
  const cached = streamedScoreCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.score;

  try {
    const data = await fetchWithTimeout(
      `${STREAMED_MATCHES_API}/${encodeURIComponent(normSport === 'football' ? 'football' : normSport)}`,
      TIMEOUT_MS,
    ) as Array<Record<string, any>>;

    if (!Array.isArray(data)) return null;

    const match = data.find(candidate => teamsMatch(title, candidate.title || ''));
    if (!match) {
      streamedScoreCache.set(cacheKey, { expiresAt: Date.now() + EVENTS_CACHE_TTL, score: null });
      return null;
    }

    const now = Date.now();
    if (timestamp && timestamp > now + 60000) {
      return {
        home: null,
        away: null,
        currentMinute: '',
      };
    }

    const home = Number(match.homeScore ?? match.score?.home ?? match.scores?.home);
    const away = Number(match.awayScore ?? match.score?.away ?? match.scores?.away);
    const score: MatchScore = {
      home: Number.isFinite(home) ? home : null,
      away: Number.isFinite(away) ? away : null,
      currentMinute: match.currentMinute || match.status?.displayClock || match.status?.detail || '',
    };

    const result = score.home !== null && score.away !== null ? score : null;
    streamedScoreCache.set(cacheKey, { expiresAt: Date.now() + EVENTS_CACHE_TTL, score: result });
    return result;
  } catch (error) {
    return null;
  }
}

function matchEspnEvent(title: string, event: EspnEvent): boolean {
  if (!event) return false;
  if (event.name && teamsMatch(title, event.name)) return true;
  if (event.shortName && teamsMatch(title, event.shortName)) return true;

  const comps = event.competitions?.[0]?.competitors || [];
  const compTeams = comps.map(c => {
    return [
      c.team?.displayName,
      c.team?.name,
      c.team?.shortDisplayName,
      c.team?.location,
      c.athlete?.displayName,
      c.athlete?.fullName,
    ].filter(Boolean) as string[];
  });

  if (compTeams.length >= 2) {
    for (const hn of compTeams[0]) {
      for (const an of compTeams[1]) {
        if (teamsMatch(title, `${hn} vs ${an}`)) return true;
        if (teamsMatch(title, `${an} vs ${hn}`)) return true;
      }
    }
  }

  return false;
}

function extractScoreForTitle(
  title: string,
  competitors: EspnCompetitor[],
): { home: number | null; away: number | null } {
  const { home: homeTitle, away: awayTitle } = extractTeamNames(title);

  const getCompScore = (c?: EspnCompetitor): number | null => {
    if (!c) return null;
    if (c.score != null && !isNaN(Number(c.score))) return Number(c.score);
    if (Array.isArray(c.linescores) && c.linescores.length > 0) {
      const sets = c.linescores.filter(l => l.winner).length;
      return sets;
    }
    return null;
  };

  // Find competitor matching home title
  const homeComp = competitors.find(c => {
    const names = [
      c.team?.displayName,
      c.team?.name,
      c.team?.shortDisplayName,
      c.team?.location,
      c.athlete?.displayName,
      c.athlete?.fullName,
    ].filter(Boolean) as string[];
    return names.some(n => teamSimilarity(homeTitle, n) >= 1.0);
  });

  // Find competitor matching away title
  const awayComp = competitors.find(c => {
    const names = [
      c.team?.displayName,
      c.team?.name,
      c.team?.shortDisplayName,
      c.team?.location,
      c.athlete?.displayName,
      c.athlete?.fullName,
    ].filter(Boolean) as string[];
    return names.some(n => teamSimilarity(awayTitle, n) >= 1.0);
  });

  if (homeComp && awayComp && homeComp !== awayComp) {
    return {
      home: getCompScore(homeComp),
      away: getCompScore(awayComp),
    };
  }

  // Fallback to homeAway tag if present
  const defaultHome = competitors.find(c => c.homeAway === 'home');
  const defaultAway = competitors.find(c => c.homeAway === 'away');

  return {
    home: getCompScore(defaultHome || competitors[0]),
    away: getCompScore(defaultAway || competitors[1]),
  };
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

// Specialized tennis score resolver from ESPN ATP/WTA
async function getTennisScoreFromEspn(
  title: string,
  timestamp: number,
): Promise<MatchScore | null> {
  const date = timestamp ? new Date(timestamp).toISOString().slice(0, 10).replaceAll('-', '') : '';
  const leagues = ['atp', 'wta'];

  for (const league of leagues) {
    const eventsList = [
      ...(date ? await fetchEspnEvents('tennis', league, date) : []),
      ...(await fetchEspnEvents('tennis', league)),
    ];

    for (const evt of eventsList) {
      for (const grp of evt.groupings || []) {
        for (const comp of grp.competitions || []) {
          const competitors = comp.competitors || [];
          if (competitors.length < 2) continue;
          const p1 = competitors[0].athlete?.displayName || competitors[0].athlete?.fullName || '';
          const p2 = competitors[1].athlete?.displayName || competitors[1].athlete?.fullName || '';

          if (!p1 || !p2) continue;

          if (teamsMatch(title, `${p1} vs ${p2}`) || teamsMatch(title, `${p2} vs ${p1}`)) {
            const scores = extractScoreForTitle(title, competitors);
            const statusDetail = comp.status?.type?.detail ||
              comp.status?.type?.shortDetail ||
              comp.status?.type?.description ||
              comp.notes?.[0]?.text || '';

            return {
              home: scores.home,
              away: scores.away,
              currentMinute: statusDetail,
            };
          }
        }
      }
    }
  }

  return null;
}

async function getEspnScore(
  title: string,
  timestamp: number,
  tournament: string,
  sport = 'football',
): Promise<MatchScore | null> {
  const normSport = (sport || '').toLowerCase().replace(/[\s-_]+/g, '');

  // Handle tennis scoreboard separately
  if (normSport === 'tennis') {
    const tennisScore = await getTennisScoreFromEspn(title, timestamp);
    if (tennisScore) return tennisScore;
  }

  const configs = getEspnSportConfigs(sport, tournament);
  if (!configs || configs.length === 0) return null;

  const date = timestamp ? new Date(timestamp).toISOString().slice(0, 10).replaceAll('-', '') : '';
  const prevDate = timestamp ? new Date(timestamp - 86400000).toISOString().slice(0, 10).replaceAll('-', '') : '';
  const nextDate = timestamp ? new Date(timestamp + 86400000).toISOString().slice(0, 10).replaceAll('-', '') : '';

  for (const config of configs) {
    let events = date ? await fetchEspnEvents(config.sport, config.league, date) : [];
    let event = events.find(candidate => matchEspnEvent(title, candidate));

    if (!event) {
      const currentEvents = await fetchEspnEvents(config.sport, config.league);
      event = currentEvents.find(candidate => matchEspnEvent(title, candidate));
    }

    if (!event && timestamp) {
      const prevEvents = await fetchEspnEvents(config.sport, config.league, prevDate);
      event = prevEvents.find(candidate => matchEspnEvent(title, candidate));

      if (!event) {
        const nextEvents = await fetchEspnEvents(config.sport, config.league, nextDate);
        event = nextEvents.find(candidate => matchEspnEvent(title, candidate));
      }
    }

    if (event) {
      const state = (event.status?.type?.state || '').toLowerCase();
      // If match is scheduled in the future / pre-game, it has not kicked off yet
      if (state === 'pre') {
        return {
          home: null,
          away: null,
          currentMinute: '',
        };
      }

      const competitors = event.competitions?.[0]?.competitors || [];
      const scores = extractScoreForTitle(title, competitors);
      const isPost = state === 'post';
      const currentMinute = isPost
        ? 'FT'
        : (event.competitions?.[0]?.status?.displayClock ||
           event.status?.type?.shortDetail ||
           event.status?.type?.detail || '');

      return {
        home: scores.home,
        away: scores.away,
        currentMinute,
      };
    }
  }

  return null;
}

async function getEventsForDate(date: string, sport = 'football'): Promise<ScoreEvent[]> {
  const normSport = (sport || '').toLowerCase().replace(/[\s-_]+/g, '');
  let sportParam = 'Soccer';
  if (normSport === 'basketball' || normSport === 'nba') sportParam = 'Basketball';
  else if (normSport === 'hockey' || normSport === 'icehockey' || normSport === 'nhl') sportParam = 'Ice%20Hockey';
  else if (normSport === 'tennis') sportParam = 'Tennis';

  const cacheKey = `${sportParam}:${date}`;
  const cached = eventsCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.events;
  const inFlight = eventsInFlight.get(cacheKey);
  if (inFlight) return inFlight;

  const request = (async () => {
    try {
      const data = await fetchWithTimeout(
        `${SCORE_API}?d=${date}&s=${sportParam}`,
        TIMEOUT_MS,
      ) as ScoreResponse;
      const events = Array.isArray(data?.events) ? data.events : [];
      eventsCache.set(cacheKey, { expiresAt: Date.now() + EVENTS_CACHE_TTL, events });
      return events;
    } catch {
      return [];
    } finally {
      eventsInFlight.delete(cacheKey);
    }
  })();
  eventsInFlight.set(cacheKey, request);
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
      const event = (data?.event || []).find(candidate => {
        const candidateTitle = candidate.strEvent ||
          `${candidate.strHomeTeam || ''} vs ${candidate.strAwayTeam || ''}`;
        return teamsMatch(title, candidateTitle);
      }) || null;
      searchCache.set(query, { expiresAt: Date.now() + SEARCH_CACHE_TTL, event });
      return event;
    } catch {
      return null;
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

  const normalizedEvents = events.map((item: any) => ({
    type: item.type?.text || item.type?.type || 'keyEvent',
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
  }));

  const normalizedCommentary = commentary
    .map((item: any) => ({
      type: item.type?.text || item.type?.type || 'commentary',
      minute: item.clock?.displayValue || item.time?.displayValue || '',
      text: item.text || item.shortText || item.description || '',
      team: item.team?.displayName || '',
      participants: (item.participants || item.athletes || []).map((participant: any, index: number) => ({
        name: participant.athlete?.displayName || participant.displayName || '',
        role: participant.role || '',
      })),
    }))
    .filter((commItem: any) => {
      const commType = commItem.type.toLowerCase();
      const commText = commItem.text.toLowerCase();
      const isKeyType = commType.includes('goal') || commText.includes('goal!') ||
                        commType.includes('card') || commText.includes('card') ||
                        commType.includes('sub') || commText.includes('substitution');
      // If structured keyEvents already has this key event at the same minute, discard redundant unstructured commentary copy
      if (isKeyType && normalizedEvents.length > 0) {
        return !normalizedEvents.some((evt: any) => evt.minute === commItem.minute);
      }
      return Boolean(commItem.text);
    });

  return [...normalizedEvents, ...normalizedCommentary].filter(
    (item: any) => item.text || item.type !== 'commentary'
  );
}

async function getEspnEvent(
  title: string,
  timestamp: number,
  tournament: string,
  sport = 'football',
): Promise<EspnEvent | null> {
  const configs = getEspnSportConfigs(sport, tournament);
  if (!configs || configs.length === 0) return null;

  const date = timestamp ? new Date(timestamp).toISOString().slice(0, 10).replaceAll('-', '') : '';

  for (const config of configs) {
    let events = date ? await fetchEspnEvents(config.sport, config.league, date) : [];
    let event = events.find(candidate => matchEspnEvent(title, candidate));

    if (!event) {
      const currentEvents = await fetchEspnEvents(config.sport, config.league);
      event = currentEvents.find(candidate => matchEspnEvent(title, candidate));
    }

    if (event) return event;
  }

  return null;
}

export async function getExternalMatchStats(
  title: string,
  timestamp: number,
  tournament: string,
  sport = 'football',
): Promise<ExternalMatchStats | null> {
  try {
    const configs = getEspnSportConfigs(sport, tournament);
    if (!configs || configs.length === 0) return null;
    const config = configs[0];
    const event = await getEspnEvent(title, timestamp, tournament, sport);
    if (!event?.id) return null;
    const cached = summaryCache.get(event.id);
    if (cached && cached.expiresAt > Date.now()) return cached.stats;
    const summary = await fetchWithTimeout(
      `${ESPN_API}/${config.sport}/${config.league}/summary?event=${event.id}`,
      TIMEOUT_MS,
    ) as any;

    let rosters = summary.rosters || [];
    if (!rosters.length && Array.isArray(summary.boxscore?.players)) {
      rosters = summary.boxscore.players.map((p: any) => ({
        team: p.team,
        roster: p.statistics?.[0]?.athletes || [],
      }));
    }

    const stats = {
      boxscore: summary.boxscore || null,
      rosters,
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
  const normSport = (sport || '').toLowerCase().replace(/[\s-_]+/g, '');
  const date = new Date(timestamp).toISOString().slice(0, 10);

  // 1. Try ESPN first (supports Football, Basketball, Hockey, Tennis, Baseball)
  let espnScore: MatchScore | null = null;
  try {
    espnScore = await getEspnScore(title, timestamp, tournament, normSport);
    if (!espnScore && normSport === 'football' && !getEspnLeague(tournament)) {
      espnScore = await getEspnScore(title, timestamp, 'uefa champions league', 'football');
    }
  } catch (error) {
    logger.warn('ESPN score provider unavailable', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
  if (espnScore && (espnScore.home !== null || espnScore.away !== null)) {
    return espnScore;
  }

  // 2. Try Streamed.pk score endpoint
  const streamedScore = await getStreamedScore(title, timestamp, normSport);
  if (streamedScore && (streamedScore.home !== null || streamedScore.away !== null)) {
    return streamedScore;
  }

  // 3. Fallback to TheSportsDB
  try {
    if (eventId) {
      const data = await fetchWithTimeout(
        `${EVENT_LOOKUP_API}?id=${encodeURIComponent(eventId)}`,
        TIMEOUT_MS,
      ) as SearchResponse;
      const event = (data?.event || []).find(candidate => {
        const candidateTitle = candidate.strEvent ||
          `${candidate.strHomeTeam || ''} vs ${candidate.strAwayTeam || ''}`;
        return teamsMatch(title, candidateTitle);
      });
      if (event) return parseScore(event);
    }

    let event: ScoreEvent | null = (await getEventsForDate(date, normSport)).find(candidate => {
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
