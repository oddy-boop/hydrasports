import { fetchWithTimeout } from './baseProvider';
import { getCacheManager } from '../cache/cacheManager';
import logger from '../logger';

export interface StandingsTeam {
  rank: number;
  team: {
    id: string;
    name: string;
    displayName: string;
    abbreviation: string;
    logo: string;
  };
  gamesPlayed: number;
  wins: number;
  ties: number;
  losses: number;
  goalDiff: string;
  points: number;
}

export interface LeagueStandings {
  leagueName: string;
  season: string;
  entries: StandingsTeam[];
}

export const LEAGUE_SLUG_MAP: Record<string, string> = {
  'serie a': 'ita.1',
  'serie a (ita)': 'ita.1',
  'serie a italian': 'ita.1',
  'italian serie a': 'ita.1',
  'premier league': 'eng.1',
  'premier league (eng)': 'eng.1',
  'premiere league': 'eng.1',
  'english premier league': 'eng.1',
  'la liga': 'esp.1',
  'la liga (esp)': 'esp.1',
  'laliga': 'esp.1',
  'laliga santander': 'esp.1',
  'bundesliga': 'ger.1',
  'bundesliga (ger)': 'ger.1',
  'bundesliga germany': 'ger.1',
  'ligue 1': 'fra.1',
  'ligue 1 (fra)': 'fra.1',
  'league 1': 'fra.1',
  'french ligue 1': 'fra.1',
  'league 1 france': 'fra.1',
  'champions league': 'uefa.champions',
  'uefa champions league': 'uefa.champions',
  'europa league': 'uefa.europa',
  'uefa europa league': 'uefa.europa',
  'major league soccer': 'usa.1',
  'major league soccer (usa)': 'usa.1',
  'mls': 'usa.1',
  'dutch eredivisie': 'ned.1',
  'dutch eredivisie (ned)': 'ned.1',
  'eredivisie': 'ned.1',
  'brasileiro série a': 'bra.1',
  'brasileirão série a (bra)': 'bra.1',
  'brasileiro serie a': 'bra.1',
  'brasileirao serie a': 'bra.1',
  'brasileiro': 'bra.1',
  'saf primera division': 'arg.1',
  'saf primera (arg)': 'arg.1',
  'saf primera': 'arg.1',
};

export function resolveLeagueSlug(query: string): string | null {
  const norm = query.toLowerCase().trim();
  if (LEAGUE_SLUG_MAP[norm]) return LEAGUE_SLUG_MAP[norm];
  if (norm.includes('ligue 1') || norm.includes('french') || norm.includes('fra.1')) return 'fra.1';
  if (norm.includes('premier') || norm.includes('epl') || norm.includes('eng.1')) return 'eng.1';
  if (norm.includes('la liga') || norm.includes('laliga') || norm.includes('esp.1') || norm.includes('spanish')) return 'esp.1';
  if (norm.includes('bundesliga') || norm.includes('ger.1') || norm.includes('german')) return 'ger.1';
  if (norm.includes('serie a') || norm.includes('ita.1') || norm.includes('italian')) return 'ita.1';
  if (norm.includes('champions') || norm.includes('ucl') || norm.includes('uefa.champions')) return 'uefa.champions';
  if (norm.includes('europa') || norm.includes('uel') || norm.includes('uefa.europa')) return 'uefa.europa';
  if (norm.includes('mls') || norm.includes('major league soccer') || norm.includes('usa.1')) return 'usa.1';
  if (norm.includes('eredivisie') || norm.includes('dutch') || norm.includes('ned.1')) return 'ned.1';
  if (norm.includes('brasileir') || norm.includes('bra.1') || norm.includes('brazil')) return 'bra.1';
  if (norm.includes('primera') || norm.includes('arg.1') || norm.includes('argentin')) return 'arg.1';
  return null;
}

export const LEAGUE_DISPLAY_NAMES: Record<string, string> = {
  'eng.1': 'Premier League',
  'esp.1': 'La Liga',
  'ita.1': 'Serie A',
  'ger.1': 'Bundesliga',
  'fra.1': 'Ligue 1',
  'uefa.champions': 'UEFA Champions League',
  'uefa.europa': 'UEFA Europa League',
  'usa.1': 'Major League Soccer',
  'ned.1': 'Dutch Eredivisie',
  'bra.1': 'Brasileirão Série A',
  'arg.1': 'SAF Primera',
};

export function getCurrentSeasonYear(): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  // European football seasons start in July/August
  const activeSeasonStart = now.getMonth() >= 6 ? currentYear : currentYear - 1;
  return String(activeSeasonStart);
}

export async function getStandingsForLeague(leagueQuery = 'serie a', seasonYear?: string): Promise<LeagueStandings> {
  const defaultSeason = getCurrentSeasonYear();
  // Clean season parameter (e.g. "2026", "2025", "2024", etc.)
  const cleanSeason = seasonYear && seasonYear !== 'current' ? String(seasonYear).trim().slice(0, 4) : defaultSeason;
  const nextYr = parseInt(cleanSeason, 10) + 1;
  const fallbackSeasonLabel = `${cleanSeason}/${nextYr}`;

  const slug = resolveLeagueSlug(leagueQuery);
  if (!slug) {
    logger.warn('Unknown league query requested for standings', { leagueQuery });
    return {
      leagueName: leagueQuery,
      season: fallbackSeasonLabel,
      entries: [],
    };
  }

  const defaultDisplayName = LEAGUE_DISPLAY_NAMES[slug] || leagueQuery;
  const cache = getCacheManager();
  const cacheKey = `standings_live_v2_${slug}_${cleanSeason}`;

  return cache.swr(cacheKey, async () => {
    try {
      const url = `https://site.api.espn.com/apis/v2/sports/soccer/${slug}/standings?season=${cleanSeason}`;
      // 7s timeout for reliable response without premature abort
      const data = await fetchWithTimeout(url, 7000);
      if (!data) throw new Error('No standings response from ESPN');

      let entriesRaw: any[] = [];
      if (Array.isArray(data.children) && data.children.length > 0) {
        for (const child of data.children) {
          if (Array.isArray(child.standings?.entries)) {
            entriesRaw.push(...child.standings.entries);
          }
        }
      }
      if (entriesRaw.length === 0) {
        entriesRaw = data.standings?.entries || [];
      }

      // If season has no entries yet or is not available, return empty entries (never fake/stale data)
      if (!Array.isArray(entriesRaw) || entriesRaw.length === 0) {
        return {
          leagueName: data.name || defaultDisplayName,
          season: fallbackSeasonLabel,
          entries: [],
        };
      }

      const leagueName = data.name || defaultDisplayName;
      const returnedYear = String(data.season?.year || cleanSeason);
      const returnedNextYr = parseInt(returnedYear, 10) + 1;
      const season = `${returnedYear}/${returnedNextYr}`;

      const entries: StandingsTeam[] = entriesRaw.map((item: any, idx: number) => {
        const stats = item.stats || [];
        const findStat = (name: string, fb = 0) => {
          const s = stats.find((x: any) => x.name === name || x.type === name);
          return s ? (typeof s.value === 'number' ? s.value : Number(s.displayValue || fb)) : fb;
        };
        const findStatDisplay = (name: string, fb = '0') => {
          const s = stats.find((x: any) => x.name === name || x.type === name);
          return s ? (s.displayValue || String(s.value ?? fb)) : fb;
        };

        const rank = Number(findStat('rank', idx + 1)) || (idx + 1);
        const gamesPlayed = Number(findStat('gamesPlayed', 0));
        const wins = Number(findStat('wins', 0));
        const ties = Number(findStat('ties', 0));
        const losses = Number(findStat('losses', 0));
        const goalDiff = String(findStatDisplay('pointDifferential', '0'));
        const points = Number(findStat('points', 0));

        const logo = item.team?.logos?.[0]?.href || 
          item.team?.logo || 
          `https://a.espncdn.com/i/teamlogos/soccer/500/${item.team?.id}.png`;

        return {
          rank,
          team: {
            id: String(item.team?.id || idx),
            name: item.team?.name || item.team?.displayName || 'Team',
            displayName: item.team?.displayName || item.team?.name || 'Team',
            abbreviation: item.team?.abbreviation || '',
            logo,
          },
          gamesPlayed,
          wins,
          ties,
          losses,
          goalDiff: goalDiff.startsWith('+') || goalDiff.startsWith('-') ? goalDiff : `+${goalDiff}`,
          points,
        };
      });

      // Sort teams by points descending, then goal difference, then wins
      entries.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const gdA = parseInt(a.goalDiff, 10) || 0;
        const gdB = parseInt(b.goalDiff, 10) || 0;
        if (gdB !== gdA) return gdB - gdA;
        return b.wins - a.wins;
      });

      // Re-index ranks sequentially: 1, 2, 3, 4...
      entries.forEach((team, index) => {
        team.rank = index + 1;
      });

      return {
        leagueName,
        season,
        entries,
      };
    } catch (err: any) {
      logger.warn('Failed to fetch real league standings from ESPN, returning empty standings', { slug, error: err.message });
      // If ESPN fails or is unavailable, return empty entries with correct league name (NEVER fake another league's table)
      return {
        leagueName: defaultDisplayName,
        season: fallbackSeasonLabel,
        entries: [],
      };
    }
  }, 900); // 15 minutes cache
}
