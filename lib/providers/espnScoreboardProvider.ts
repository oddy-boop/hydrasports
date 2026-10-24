import { Match, Channel } from '../types';
import { StreamProvider } from './types';
import { fetchWithTimeout } from './baseProvider';
import { teamsMatch } from '../utils/matching';
import { getCacheManager } from '../cache/cacheManager';
import logger from '../logger';

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';
const TIMEOUT_MS = 4000;

export class EspnScoreboardProvider implements StreamProvider {
  id = 'espn';
  name = 'ESPN Scoreboard';

  async fetchMatches(): Promise<Match[]> {
    const cache = getCacheManager();
    return cache.swr('espn_multisport_matches', async () => {
      const matches: Match[] = [];

      // 1. Tennis (ATP & WTA)
      const tennisLeagues = ['atp', 'wta'];
      for (const league of tennisLeagues) {
        try {
          const res = await fetchWithTimeout(`${ESPN_BASE}/tennis/${league}/scoreboard`, TIMEOUT_MS) as any;
          for (const event of res?.events || []) {
            const tournamentName = event.name || `${league.toUpperCase()} Tournament`;
            for (const grp of event.groupings || []) {
              const groupingName = grp.grouping?.displayName || '';
              for (const comp of grp.competitions || []) {
                const competitors = comp.competitors || [];
                if (competitors.length < 2) continue;

                const c1 = competitors[0];
                const c2 = competitors[1];
                const n1 = c1.athlete?.displayName || c1.athlete?.fullName || '';
                const n2 = c2.athlete?.displayName || c2.athlete?.fullName || '';
                if (!n1 || !n2 || n1.toLowerCase() === 'tbd' || n2.toLowerCase() === 'tbd') continue;

                const state = comp.status?.type?.state;
                const status = state === 'post' ? 'finished' : state === 'in' ? 'live' : 'upcoming';

                const s1 = c1.score != null ? Number(c1.score) : ((c1.linescores || []).filter((l: any) => l.winner).length);
                const s2 = c2.score != null ? Number(c2.score) : ((c2.linescores || []).filter((l: any) => l.winner).length);

                const timestamp = comp.date ? new Date(comp.date).getTime() : Date.now();
                const detail = comp.status?.type?.detail || comp.status?.type?.shortDetail || comp.notes?.[0]?.text || '';

                matches.push({
                  id: `espn_tennis_${comp.id || `${n1}_${n2}`.replace(/\s+/g, '_')}`,
                  title: `${n1} vs ${n2}`,
                  sport: 'tennis',
                  status,
                  timestamp,
                  tournament: `${tournamentName}${groupingName ? ` - ${groupingName}` : ''}`,
                  country: 'International',
                  priority: status === 'live' ? 1 : 2,
                  homeTeam: {
                    name: n1,
                    badge: c1.athlete?.flag?.href || 'https://a.espncdn.com/redesign/assets/img/icons/icon-tennis.png',
                  },
                  awayTeam: {
                    name: n2,
                    badge: c2.athlete?.flag?.href || 'https://a.espncdn.com/redesign/assets/img/icons/icon-tennis.png',
                  },
                  leagueLogo: 'https://a.espncdn.com/redesign/assets/img/icons/icon-tennis.png',
                  poster: '',
                  venue: comp.venue?.fullName || '',
                  note: detail,
                  sources: [],
                  fallbackChannels: [
                    { name: 'Tennis Channel HD', url: 'https://streamed.pk/api/stream/tennis-channel' }
                  ],
                  currentMinute: detail,
                  currentMinuteNumber: 0,
                  homeScore: s1,
                  awayScore: s2,
                  provider: this.id,
                  upstreamCategory: 'tennis',
                  popular: status === 'live',
                });
              }
            }
          }
        } catch (err) {
          logger.warn(`Failed fetching ESPN tennis ${league}`, { error: String(err) });
        }
      }

      // 2. Hockey (NHL)
      try {
        const res = await fetchWithTimeout(`${ESPN_BASE}/hockey/nhl/scoreboard`, TIMEOUT_MS) as any;
        for (const event of res?.events || []) {
          const comp = event.competitions?.[0];
          const competitors = comp?.competitors || [];
          if (competitors.length < 2) continue;

          const homeComp = competitors.find((c: any) => c.homeAway === 'home') || competitors[0];
          const awayComp = competitors.find((c: any) => c.homeAway === 'away') || competitors[1];

          const homeName = homeComp.team?.displayName || homeComp.team?.name || 'Home';
          const awayName = awayComp.team?.displayName || awayComp.team?.name || 'Away';

          const state = comp.status?.type?.state;
          const status = state === 'post' ? 'finished' : state === 'in' ? 'live' : 'upcoming';

          const homeScore = homeComp.score != null ? Number(homeComp.score) : null;
          const awayScore = awayComp.score != null ? Number(awayComp.score) : null;
          const timestamp = event.date ? new Date(event.date).getTime() : Date.now();
          const detail = comp.status?.displayClock || comp.status?.type?.detail || comp.status?.type?.shortDetail || '';

          matches.push({
            id: `espn_hockey_${event.id}`,
            title: `${homeName} vs ${awayName}`,
            sport: 'hockey',
            status,
            timestamp,
            tournament: 'NHL',
            country: 'USA/Canada',
            priority: status === 'live' ? 1 : 3,
            homeTeam: {
              name: homeName,
              badge: homeComp.team?.logo || `https://a.espncdn.com/i/teamlogos/nhl/500/${homeComp.team?.abbreviation?.toLowerCase()}.png`,
            },
            awayTeam: {
              name: awayName,
              badge: awayComp.team?.logo || `https://a.espncdn.com/i/teamlogos/nhl/500/${awayComp.team?.abbreviation?.toLowerCase()}.png`,
            },
            leagueLogo: 'https://a.espncdn.com/i/teamlogos/nhl/500/nhl.png',
            poster: '',
            venue: comp.venue?.fullName || '',
            note: detail,
            sources: [],
            fallbackChannels: [
              { name: 'NHL Live Stream HD', url: 'https://streamed.pk/api/stream/nhl-network' }
            ],
            currentMinute: detail,
            currentMinuteNumber: 0,
            homeScore,
            awayScore,
            provider: this.id,
            upstreamCategory: 'hockey',
            popular: status === 'live',
          });
        }
      } catch (err) {
        logger.warn('Failed fetching ESPN NHL', { error: String(err) });
      }

      // 3. Basketball (NBA)
      try {
        const res = await fetchWithTimeout(`${ESPN_BASE}/basketball/nba/scoreboard`, TIMEOUT_MS) as any;
        for (const event of res?.events || []) {
          const comp = event.competitions?.[0];
          const competitors = comp?.competitors || [];
          if (competitors.length < 2) continue;

          const homeComp = competitors.find((c: any) => c.homeAway === 'home') || competitors[0];
          const awayComp = competitors.find((c: any) => c.homeAway === 'away') || competitors[1];

          const homeName = homeComp.team?.displayName || homeComp.team?.name || 'Home';
          const awayName = awayComp.team?.displayName || awayComp.team?.name || 'Away';

          const state = comp.status?.type?.state;
          const status = state === 'post' ? 'finished' : state === 'in' ? 'live' : 'upcoming';

          const homeScore = homeComp.score != null ? Number(homeComp.score) : null;
          const awayScore = awayComp.score != null ? Number(awayComp.score) : null;
          const timestamp = event.date ? new Date(event.date).getTime() : Date.now();
          const detail = comp.status?.displayClock || comp.status?.type?.detail || comp.status?.type?.shortDetail || '';

          matches.push({
            id: `espn_bball_${event.id}`,
            title: `${homeName} vs ${awayName}`,
            sport: 'basketball',
            status,
            timestamp,
            tournament: 'NBA',
            country: 'USA',
            priority: status === 'live' ? 1 : 3,
            homeTeam: {
              name: homeName,
              badge: homeComp.team?.logo || `https://a.espncdn.com/i/teamlogos/nba/500/${homeComp.team?.abbreviation?.toLowerCase()}.png`,
            },
            awayTeam: {
              name: awayName,
              badge: awayComp.team?.logo || `https://a.espncdn.com/i/teamlogos/nba/500/${awayComp.team?.abbreviation?.toLowerCase()}.png`,
            },
            leagueLogo: 'https://a.espncdn.com/i/teamlogos/nba/500/nba.png',
            poster: '',
            venue: comp.venue?.fullName || '',
            note: detail,
            sources: [],
            fallbackChannels: [],
            currentMinute: detail,
            currentMinuteNumber: 0,
            homeScore,
            awayScore,
            provider: this.id,
            upstreamCategory: 'basketball',
            popular: status === 'live',
          });
        }
      } catch (err) {
        logger.warn('Failed fetching ESPN NBA', { error: String(err) });
      }

      return matches;
    }, 25);
  }

  async resolveStreams(
    matchTitle: string,
    homeTeam: string,
    awayTeam: string,
    matchId: string,
    preFetchedMatch?: Match | null
  ): Promise<Channel[]> {
    return [];
  }
}
