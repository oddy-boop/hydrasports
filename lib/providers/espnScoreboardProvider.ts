import { Match, Channel } from '../types';
import { StreamProvider } from './types';
import { fetchWithTimeout } from './baseProvider';
import { teamsMatch } from '../utils/matching';
import { getCacheManager } from '../cache/cacheManager';
import logger from '../logger';

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';
const TIMEOUT_MS = 6000;

export const TENNIS_STREAM_CHANNELS: { name: string; url: string; quality: string }[] = [
  {
    name: 'Tennis Channel HD (1080p Direct HLS)',
    url: 'https://cdn-ue1-prod.tsv2.amagi.tv/linear/amg01444-tennischannelth-tennischannelnl-samsungnl/playlist.m3u8',
    quality: '1080p',
  },
  {
    name: 'Tennis Channel 2 HD (1080p)',
    url: 'https://mumbai-edge.smartplaytv.in/Tennis2/index.m3u8',
    quality: '1080p',
  },
  {
    name: 'SuperTennis HD International',
    url: 'https://live-embed.supertennix.hiway.media/restreamer/supertennix_client/gpu-a-c0-16/restreamer/outgest/aa3673f1-e178-44a9-a947-ef41db73211a/manifest.m3u8',
    quality: 'HD',
  },
  {
    name: 'Tennis Channel Global',
    url: 'https://streamed.pk/api/stream/tennis-channel',
    quality: 'HD',
  },
];

export const FOOTBALL_STREAM_CHANNELS: { name: string; url: string; quality: string }[] = [
  {
    name: 'CBS Sports Golazo HD (Direct 1-Click HLS)',
    url: 'https://service-stitcher.clusters.pluto.tv/stitch/hls/channel/5e0f7cd09315350009ec3551/master.m3u8?advertisingId=&appName=web&appVersion=unknown&appStoreUrl=&architecture=&buildVersion=&clientDeviceType=0&deviceDNT=0&deviceId=unknown&deviceMake=Chrome&deviceModel=web&deviceType=web&deviceVersion=unknown&includeExtendedEvents=false&sid=unknown&userId=',
    quality: '1080p',
  },
  {
    name: 'Red Bull Sports Football (Direct 1-Click HLS)',
    url: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
    quality: '1080p',
  },
  {
    name: 'Pluto TV Sports Europe (Direct 1-Click HLS)',
    url: 'https://service-stitcher.clusters.pluto.tv/stitch/hls/channel/5d8b87e62a28b05612347cb5/master.m3u8?advertisingId=&appName=web&appVersion=unknown&appStoreUrl=&architecture=&buildVersion=&clientDeviceType=0&deviceDNT=0&deviceId=unknown&deviceMake=Chrome&deviceModel=web&deviceType=web&deviceVersion=unknown&includeExtendedEvents=false&sid=unknown&userId=',
    quality: '1080p',
  },
];

export const BASKETBALL_STREAM_CHANNELS: { name: string; url: string; quality: string }[] = [
  {
    name: 'Hoops & Action Sports (Direct 1-Click HLS)',
    url: 'https://service-stitcher.clusters.pluto.tv/stitch/hls/channel/5d8b87e62a28b05612347cb5/master.m3u8?advertisingId=&appName=web&appVersion=unknown&appStoreUrl=&architecture=&buildVersion=&clientDeviceType=0&deviceDNT=0&deviceId=unknown&deviceMake=Chrome&deviceModel=web&deviceType=web&deviceVersion=unknown&includeExtendedEvents=false&sid=unknown&userId=',
    quality: '1080p',
  },
  {
    name: 'Red Bull Live Arena (Direct 1-Click HLS)',
    url: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
    quality: '1080p',
  },
];

export class EspnScoreboardProvider implements StreamProvider {
  id = 'espn';
  name = 'ESPN Scoreboard';

  async fetchMatches(): Promise<Match[]> {
    const cache = getCacheManager();
    return cache.swr('espn_multisport_matches', async () => {
      const matches: Match[] = [];
      const now = Date.now();

      // Parallel tasks for all sports leagues
      const endpoints: { category: string; sport: string; league: string; country: string }[] = [
        { category: 'tennis', sport: 'tennis', league: 'atp', country: 'ATP Tour' },
        { category: 'tennis', sport: 'tennis', league: 'wta', country: 'WTA Tour' },
        { category: 'hockey', sport: 'hockey', league: 'nhl', country: 'USA/Canada' },
        { category: 'basketball', sport: 'basketball', league: 'nba', country: 'USA' },
        { category: 'basketball', sport: 'basketball', league: 'nbl', country: 'Australia' },
        { category: 'soccer', sport: 'football', league: 'eng.1', country: 'England' },
        { category: 'soccer', sport: 'football', league: 'esp.1', country: 'Spain' },
        { category: 'soccer', sport: 'football', league: 'ita.1', country: 'Italy' },
        { category: 'soccer', sport: 'football', league: 'ger.1', country: 'Germany' },
        { category: 'soccer', sport: 'football', league: 'fra.1', country: 'France' },
        { category: 'soccer', sport: 'football', league: 'uefa.champions', country: 'Europe' },
      ];

      const fetchTasks = endpoints.map(async ep => {
        try {
          const res = await fetchWithTimeout(`${ESPN_BASE}/${ep.category}/${ep.league}/scoreboard`, TIMEOUT_MS) as any;
          return { ep, data: res };
        } catch (err: any) {
          logger.warn(`ESPN scoreboard fetch failed for ${ep.category}/${ep.league}`, { error: err?.message });
          return { ep, data: null };
        }
      });

      const results = await Promise.allSettled(fetchTasks);

      for (const r of results) {
        if (r.status !== 'fulfilled' || !r.value?.data) continue;
        const { ep, data } = r.value;
        const events = data.events || [];

        // 1. Process Tennis Events (ATP & WTA)
        if (ep.sport === 'tennis') {
          for (const event of events) {
            const tournamentName = event.name || `${ep.league.toUpperCase()} Tournament`;
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
                const timestamp = comp.date ? new Date(comp.date).getTime() : now;

                // Smart filtering: live matches ALWAYS included; upcoming if within 24h; finished if within 6h
                const isLive = state === 'in';
                const isUpcomingSoon = state === 'pre' && Math.abs(timestamp - now) <= 24 * 3600 * 1000;
                const isRecentlyFinished = state === 'post' && (now - timestamp) <= 6 * 3600 * 1000;

                if (!isLive && !isUpcomingSoon && !isRecentlyFinished) continue;

                const status = isLive ? 'live' : isRecentlyFinished ? 'finished' : 'upcoming';

                const s1 = c1.score != null ? Number(c1.score) : ((c1.linescores || []).filter((l: any) => l.winner).length);
                const s2 = c2.score != null ? Number(c2.score) : ((c2.linescores || []).filter((l: any) => l.winner).length);
                const detail = comp.status?.type?.detail || comp.status?.type?.shortDetail || comp.notes?.[0]?.text || (isLive ? 'Live Set' : '');

                matches.push({
                  id: `espn_tennis_${comp.id || `${n1}_${n2}`.replace(/[\s-]+/g, '_').toLowerCase()}`,
                  title: `${n1} vs ${n2}`,
                  sport: 'tennis',
                  status,
                  timestamp,
                  tournament: `${tournamentName}${groupingName ? ` - ${groupingName}` : ''}`,
                  country: ep.country,
                  priority: status === 'live' ? 1 : 3,
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
                  venue: comp.venue?.fullName || tournamentName,
                  note: detail,
                  sources: TENNIS_STREAM_CHANNELS.map((ch, idx) => ({
                    source: `tc-${idx + 1}`,
                    id: String(idx + 1),
                    url: ch.url,
                    label: ch.name,
                    quality: ch.quality,
                  })),
                  fallbackChannels: TENNIS_STREAM_CHANNELS,
                  currentMinute: detail,
                  currentMinuteNumber: 0,
                  homeScore: isUpcomingSoon ? null : s1,
                  awayScore: isUpcomingSoon ? null : s2,
                  provider: this.id,
                  upstreamCategory: 'tennis',
                  popular: status === 'live',
                });
              }
            }
          }
          continue;
        }

        // 2. Process Hockey (NHL), Basketball (NBA/NBL), and Soccer Events
        for (const event of events) {
          const comp = event.competitions?.[0];
          const competitors = comp?.competitors || [];
          if (competitors.length < 2) continue;

          const homeComp = competitors.find((c: any) => c.homeAway === 'home') || competitors[0];
          const awayComp = competitors.find((c: any) => c.homeAway === 'away') || competitors[1];

          const homeName = homeComp.team?.displayName || homeComp.team?.name || 'Home';
          const awayName = awayComp.team?.displayName || awayComp.team?.name || 'Away';

          const state = comp.status?.type?.state;
          const timestamp = event.date ? new Date(event.date).getTime() : now;

          // Filter out matches older than 24h
          if (now - timestamp > 24 * 3600 * 1000) continue;

          const isFuture = timestamp > now + 60000;
          const status = isFuture ? 'upcoming' : (state === 'post' ? 'finished' : (state === 'in' ? 'live' : 'upcoming'));

          const homeScore = isFuture ? null : (homeComp.score != null ? Number(homeComp.score) : null);
          const awayScore = isFuture ? null : (awayComp.score != null ? Number(awayComp.score) : null);
          const detail = isFuture ? '' : (comp.status?.displayClock || comp.status?.type?.detail || comp.status?.type?.shortDetail || '');

          const tournamentName = ep.sport === 'hockey' ? 'NHL' :
            ep.sport === 'basketball' ? (ep.league === 'nba' ? 'NBA' : 'NBL') :
            event.season?.displayName || ep.country;

          matches.push({
            id: `espn_${ep.sport}_${event.id}`,
            title: `${homeName} vs ${awayName}`,
            sport: ep.sport,
            status,
            timestamp,
            tournament: tournamentName,
            country: ep.country,
            priority: status === 'live' ? 1 : 4,
            homeTeam: {
              name: homeName,
              badge: homeComp.team?.logo || '',
            },
            awayTeam: {
              name: awayName,
              badge: awayComp.team?.logo || '',
            },
            leagueLogo: '',
            poster: '',
            venue: comp.venue?.fullName || '',
            note: detail,
            sources: [],
            fallbackChannels: ep.sport === 'hockey' ? [
              { name: 'NHL Live Stream HD', url: 'https://streamed.pk/api/stream/nhl-network' }
            ] : [],
            currentMinute: detail,
            currentMinuteNumber: 0,
            homeScore,
            awayScore,
            provider: this.id,
            upstreamCategory: ep.sport,
            popular: status === 'live',
          });
        }
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
    const isTennis = matchId.includes('tennis') ||
      preFetchedMatch?.sport === 'tennis' ||
      (preFetchedMatch?.tournament || '').toLowerCase().includes('open') ||
      matchTitle.toLowerCase().includes('atp') ||
      matchTitle.toLowerCase().includes('wta');

    if (isTennis) {
      return TENNIS_STREAM_CHANNELS.map((ch, idx) => ({
        name: ch.name,
        url: ch.url,
        provider: 'tennis-stream-server',
        quality: ch.quality,
      }));
    }

    const sport = (preFetchedMatch?.sport || '').toLowerCase();
    const isFootball = sport === 'football' || matchId.includes('soccer') || matchId.includes('football');
    if (isFootball) {
      return FOOTBALL_STREAM_CHANNELS.map((ch, idx) => ({
        name: ch.name,
        url: ch.url,
        provider: 'football-hls-server',
        quality: ch.quality,
      }));
    }

    const isBasketball = sport === 'basketball' || matchId.includes('nba') || matchId.includes('basketball');
    if (isBasketball) {
      return BASKETBALL_STREAM_CHANNELS.map((ch, idx) => ({
        name: ch.name,
        url: ch.url,
        provider: 'basketball-hls-server',
        quality: ch.quality,
      }));
    }

    return [];
  }
}
