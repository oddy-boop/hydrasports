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

const LEAGUE_SLUG_MAP: Record<string, string> = {
  'serie a': 'ita.1',
  'serie a italian': 'ita.1',
  'italian serie a': 'ita.1',
  'premier league': 'eng.1',
  'premiere league': 'eng.1',
  'english premier league': 'eng.1',
  'la liga': 'esp.1',
  'laliga': 'esp.1',
  'laliga santander': 'esp.1',
  'bundesliga': 'ger.1',
  'bundesliga germany': 'ger.1',
  'ligue 1': 'fra.1',
  'league 1 france': 'fra.1',
  'champions league': 'uefa.champions',
  'uefa champions league': 'uefa.champions',
  'europa league': 'uefa.europa',
  'uefa europa league': 'uefa.europa',
  'major league soccer': 'usa.1',
  'mls': 'usa.1',
  'dutch eredivisie': 'ned.1',
  'eredivisie': 'ned.1',
  'brasileiro série a': 'bra.1',
  'brasileiro': 'bra.1',
  'saf primera division': 'arg.1',
  'saf primera': 'arg.1',
};

export async function getStandingsForLeague(leagueQuery = 'serie a'): Promise<LeagueStandings> {
  const normalized = leagueQuery.toLowerCase().trim();
  const slug = LEAGUE_SLUG_MAP[normalized] || 'ita.1';

  const cache = getCacheManager();
  return cache.swr(`standings_v2_${slug}`, async () => {
    try {
      const url = `https://site.api.espn.com/apis/v2/sports/soccer/${slug}/standings`;
      const data = await fetchWithTimeout(url, 5000);
      if (!data) throw new Error('No standings response');

      const entriesRaw = data.children?.[0]?.standings?.entries || data.standings?.entries || [];
      const leagueName = data.name || leagueQuery;
      const season = String(data.season?.year || new Date().getFullYear());

      const entries: StandingsTeam[] = entriesRaw.map((item: any, idx: number) => {
        const stats = item.stats || [];
        const findStat = (name: string, fallback = 0) => {
          const s = stats.find((x: any) => x.name === name || x.type === name);
          return s ? (typeof s.value === 'number' ? s.value : Number(s.displayValue || fallback)) : fallback;
        };
        const findStatDisplay = (name: string, fallback = '0') => {
          const s = stats.find((x: any) => x.name === name || x.type === name);
          return s ? (s.displayValue || String(s.value ?? fallback)) : fallback;
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
          goalDiff,
          points,
        };
      });

      return {
        leagueName,
        season,
        entries: entries, // Full league table (all 20 teams)
      };
    } catch (err: any) {
      logger.error('Failed to fetch real league standings from ESPN', { slug, error: err.message });
      return {
        leagueName: leagueQuery,
        season: String(new Date().getFullYear()),
        entries: [],
      };
    }
  }, 300); // 5 minutes cache
}
