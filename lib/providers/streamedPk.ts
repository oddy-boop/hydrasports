import { Match, Channel } from '../types';
import { StreamProvider } from './types';
import { fetchWithTimeout } from './baseProvider';
import { getCountryForLeague, getLeaguePriority, teamsMatch } from '../utils/matching';
import { getCacheManager } from '../cache/cacheManager';
import { cleanTeamBadgeUrl, getTeamLeague } from '../utils/teamLogos';
import logger from '../logger';

const STREAMED_API = 'https://streamed.pk/api/matches';
const STREAMED_SPORTS = ['football', 'basketball', 'tennis', 'hockey', 'baseball'];
const STREAMED_STREAM = 'https://streamed.pk/api/stream';
const TIMEOUT_MS = 7000;
const SHORT_TIMEOUT = 4000;

function getCompetition(match: StreamedRawMatch): string {
  const sourceText = (match.sources || []).map(source => source.id).join(' ').toLowerCase();
  const competitions: [string, string][] = [
    ['premier-league', 'Premier League'],
    ['la-liga', 'La Liga'],
    ['laliga', 'La Liga'],
    ['serie-a', 'Serie A'],
    ['bundesliga', 'Bundesliga'],
    ['ligue-1', 'Ligue 1'],
    ['eredivisie', 'Eredivisie'],
    ['champions-league', 'Champions League'],
    ['europa-league', 'Europa League'],
    ['mls', 'MLS'],
    ['allsvenskan', 'Allsvenskan'],
    ['championship', 'Championship'],
    ['2-bundesliga', '2. Bundesliga'],
    ['segunda', 'La Liga 2'],
    ['serie-b', 'Serie B'],
    ['primeira-liga', 'Primeira Liga'],
    ['super-lig', 'Süper Lig'],
    ['pro-league', 'Belgian Pro League'],
    ['scottish', 'Scottish Premiership'],
  ];

  const matched = competitions.find(([needle]) => sourceText.includes(needle))?.[1];
  if (matched) return matched;

  // Detect league from participating team names
  const homeName = match.teams?.home?.name || '';
  const awayName = match.teams?.away?.name || '';
  const homeLeague = getTeamLeague(homeName);
  if (homeLeague) return homeLeague;
  const awayLeague = getTeamLeague(awayName);
  if (awayLeague) return awayLeague;

  const rawCat = match.category || '';
  if (rawCat && rawCat.toLowerCase() !== 'football') {
    return rawCat.charAt(0).toUpperCase() + rawCat.slice(1);
  }

  return 'League Match';
}

interface StreamedRawMatch {
  id: string;
  title: string;
  category: string;
  date: number;
  poster?: string;
  popular?: boolean;
  sport?: string;
  teams?: {
    home?: { name: string; badge?: string };
    away?: { name: string; badge?: string };
  };
  sources?: { source: string; id: string }[];
}

export class StreamedPkProvider implements StreamProvider {
  id = 'streamed';
  name = 'Streamed.pk';

  private async fetchRawMatches(sport?: string): Promise<StreamedRawMatch[]> {
    const cache = getCacheManager();
    const cacheKey = `streamed_raw_${sport || 'all'}`;
    return cache.swr(cacheKey, async () => {
      try {
        const data = await fetchWithTimeout(
          sport ? `${STREAMED_API}/${sport}` : `${STREAMED_API}/football`,
          TIMEOUT_MS,
        );
        if (!Array.isArray(data)) return [];
        return data
          .filter((match): match is StreamedRawMatch => Boolean(match && typeof match === 'object'))
          .map(match => ({ ...match, sport: match.sport || sport }));
      } catch (err) {
        logger.error(`Streamed.pk ${sport || 'football'} API request failed`, err);
        return [];
      }
    }, 30);
  }

  async fetchMatches(): Promise<Match[]> {
    const matchResults = await Promise.all(STREAMED_SPORTS.map(sport => this.fetchRawMatches(sport)));
    const matches = matchResults.flat();
    const now = Date.now();

    return matches.map((match): Match => {
      const timestamp = Number(match.date) || now;
      const status = timestamp <= now
        ? timestamp > now - 125 * 60000 ? 'live' : 'finished'
        : 'upcoming';
      const homeTeam = match.teams?.home?.name || 'Home';
      const awayTeam = match.teams?.away?.name || 'Away';
      const sport = match.sport || match.category || 'football';
      const tournament = sport === 'football' ? getCompetition(match) : match.category || sport;
      const badgeUrl = (badge?: string) => badge ? `https://streamed.pk/api/images/proxy/${badge}.webp` : '';

      return {
        id: String(match.id),
        title: match.title || `${homeTeam} vs ${awayTeam}`,
        sport,
        status,
        timestamp,
        tournament,
        country: getCountryForLeague(tournament),
        priority: getLeaguePriority(tournament),
        homeTeam: { name: homeTeam, badge: cleanTeamBadgeUrl(badgeUrl(match.teams?.home?.badge), homeTeam, sport) },
        awayTeam: { name: awayTeam, badge: cleanTeamBadgeUrl(badgeUrl(match.teams?.away?.badge), awayTeam, sport) },
        leagueLogo: '',
        poster: match.poster ? `https://streamed.pk${match.poster}` : '',
        venue: '',
        note: '',
        sources: (match.sources || []).map((source, index) => ({
          source: source.source,
          id: String(source.id),
          url: '',
          label: `Server ${index + 1}`,
          quality: 'HD',
        })),
        fallbackChannels: [],
        currentMinute: '',
        currentMinuteNumber: 0,
        homeScore: null,
        awayScore: null,
        provider: this.id,
        upstreamCategory: match.category || sport,
        popular: Boolean(match.popular),
      };
    });
  }

  private async resolveStreamedStream(source: string, id: string): Promise<{ url: string; quality: string }[]> {
    try {
      const url = `${STREAMED_STREAM}/${source}/${id}`;
      const data = await fetchWithTimeout(url, SHORT_TIMEOUT);
      if (Array.isArray(data) && data.length > 0) {
        return data.map((s: any) => ({
          url: s.embedUrl || s.url || '',
          quality: s.hd ? 'HD' : 'SD',
        }));
      }
      if (data?.url || data?.embedUrl || data?.streamUrl || data?.iframe) {
        return [{
          url: data.url || data.embedUrl || data.streamUrl || data.iframe,
          quality: 'HD',
        }];
      }
      return [];
    } catch (err) {
      return [];
    }
  }

  async resolveStreams(
    matchTitle: string,
    homeTeam: string,
    awayTeam: string,
    matchId: string,
    preFetchedMatch?: Match | null
  ): Promise<Channel[]> {
    try {
      const matches = await Promise.all(STREAMED_SPORTS.map(sport => this.fetchRawMatches(sport))).then(results => results.flat());
      const channels: Channel[] = [];
      const streamTasks: Promise<{ urls: { url: string; quality: string }[]; source: any }>[] = [];
      
      for (const m of matches) {
        if (teamsMatch(matchTitle, m.title)) {
          const sources = m.sources || [];
          for (const src of sources) {
            streamTasks.push(
              this.resolveStreamedStream(src.source, src.id)
                .then(urls => ({ urls, source: src }))
                .catch(() => ({ urls: [], source: src }))
            );
          }
        }
      }
      
      const streamResults = await Promise.allSettled(streamTasks);
      let serverIndex = 1;
      
      for (const r of streamResults) {
        if (r.status === 'fulfilled') {
          for (const su of r.value.urls) {
            if (su.url) {
              channels.push({
                name: `Server ${serverIndex++}`,
                url: su.url,
                provider: this.id,
                quality: su.quality || 'HD',
              });
            }
          }
        }
      }
      
      return channels;
    } catch (err) {
      logger.error('Streamed.pk streams resolution failed', err, { matchTitle });
      return [];
    }
  }
}
