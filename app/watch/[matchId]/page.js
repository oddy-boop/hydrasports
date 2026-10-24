import { getMatchDetails, getMatchStatsForMatch, resolveAllStreams } from '@/lib/streamEngine';
import { getScoreForMatch } from '@/lib/providers/scoreProvider';
import MatchHubView from '@/components/MatchHubView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }) {
  const { matchId } = await params;
  try {
    const match = await getMatchDetails(matchId);
    if (!match) {
      return {
        title: 'Watch Live Match',
        description: 'Watch live sports streaming on HydraSports.',
      };
    }
    const title = match.title || `${match.homeTeam?.name || 'Home'} vs ${match.awayTeam?.name || 'Away'}`;
    const tournament = match.tournament ? ` (${match.tournament})` : '';
    const sport = (match.sport || 'sports').toUpperCase();

    return {
      title: `Live Stream: ${title}${tournament}`,
      description: `Watch ${title} live stream online. Real-time scores, verified player ratings, tactical lineups, substitutions, and HD broadcast on HydraSports.`,
      openGraph: {
        title: `Live Stream: ${title}${tournament}`,
        description: `Watch ${title} live stream online with real-time match stats and verified tactical telemetry on HydraSports.`,
        images: match.poster ? [{ url: match.poster }] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: `Live: ${title}${tournament}`,
        description: `Live sports stream for ${title}. Real-time scores, lineups, and ratings.`,
      },
    };
  } catch {
    return {
      title: 'Watch Live Match',
      description: 'Watch live sports streaming on HydraSports.',
    };
  }
}

export default async function WatchPage({ params }) {
  const { matchId } = await params;
  let match = null;
  let streamUrl = null;
  let channels = [];
  let errorMsg = null;
  let stats = null;

  const userFacingErrors = {
    'No streams available from any provider': 'No streams are available for this match right now.',
    'Match not found': 'This match could not be found. It may have been removed.',
  };

  try {
    match = await getMatchDetails(matchId);
    if (!match) throw new Error('Match not found');

    const [resolvedResult, statsResult, scoreResult] = await Promise.allSettled([
      resolveAllStreams(match.title, matchId, match.homeTeam?.name || '', match.awayTeam?.name || '', match),
      getMatchStatsForMatch(match),
      getScoreForMatch(
        match.title,
        match.timestamp,
        match.tournament,
        match.id.match(/(\d+)$/)?.[1],
        match.sport,
      ),
    ]);

    if (resolvedResult.status === 'fulfilled') {
      const resolved = resolvedResult.value;
      streamUrl = resolved.proxiedUrl || resolved.url;
      channels = resolved.channels || [];
    }

    if (statsResult.status === 'fulfilled') {
      stats = statsResult.value;
    }

    if (
      scoreResult.status === 'fulfilled' &&
      scoreResult.value &&
      typeof scoreResult.value.home === 'number' &&
      typeof scoreResult.value.away === 'number'
    ) {
      match = {
        ...match,
        homeScore: scoreResult.value.home,
        awayScore: scoreResult.value.away,
        currentMinute: scoreResult.value.currentMinute || match.currentMinute,
      };
    }
  } catch (err) {
    errorMsg = userFacingErrors[err.message] || 'Unable to load this match. Please try again.';
    match = await getMatchDetails(matchId);
  }

  if (!match) {
    match = {
      id: matchId,
      title: 'Match Not Found',
      tournament: 'FIFA World Cup',
      timestamp: Date.now(),
      homeTeam: { name: 'Home Team', badge: '' },
      awayTeam: { name: 'Away Team', badge: '' },
      sources: [],
      fallbackChannels: [],
      leagueLogo: '',
      poster: '',
      venue: '',
      note: '',
      provider: 'Hydra Sport',
      upstreamCategory: 'Football',
      popular: false,
    };
  }

  return (
    <MatchHubView
      match={match}
      stats={stats}
      streamUrl={streamUrl}
      channels={channels}
      errorMsg={errorMsg}
    />
  );
}
