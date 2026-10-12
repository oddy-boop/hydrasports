import { getMatchDetails, getMatchStatsForMatch, resolveAllStreams } from '@/lib/streamEngine';
import WatchMatchPlayer from '@/components/WatchMatchPlayer';
import MatchCountdown from '@/components/MatchCountdown';
import MatchStatsSection from '@/components/MatchStatsSection';
import LineupSection from '@/components/LineupSection';
import MatchEventsSection from '@/components/MatchEventsSection';
import LiveScoreboard from '@/components/LiveScoreboard';
import { RefreshCw } from 'lucide-react';
import { getScoreForMatch } from '@/lib/providers/scoreProvider';
import WatchBackButton from '@/components/WatchBackButton';

export const revalidate = 10;

export default async function WatchPage({ params, searchParams }) {
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
    if (statsResult.status === 'fulfilled') stats = statsResult.value;
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
      tournament: '',
      timestamp: Date.now(),
      homeTeam: { name: 'Home', badge: '' },
      awayTeam: { name: 'Away', badge: '' },
      sources: [],
      fallbackChannels: [],
      leagueLogo: '',
      poster: '',
      venue: '',
      note: '',
      provider: '',
      upstreamCategory: '',
      popular: false,
    };
  }

  const dateStr = new Date(match.timestamp).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const timeStr = new Date(match.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const boxscore = stats?.boxscore;
  const teamStats = boxscore?.teams || [];
  const commentary = stats?.commentary || [];
  const rosters = stats?.rosters || [];
  const sport = match.sport || 'football';
  const isFootball = sport === 'football';
  const isLive = match.status === 'live';
  const hasScore = typeof match.homeScore === 'number' && typeof match.awayScore === 'number';
  const isFinal = !isLive && hasScore && match.timestamp <= Date.now();

  return (
    <div className="watch-page w-full min-h-screen text-slate-900 pb-20">
      <main className="watch-content">
        <div className="flex items-center">
          <WatchBackButton />
        </div>
        <section className="watch-hero">
          <div className="watch-score-panel">
            {isLive || isFinal ? (
              <LiveScoreboard matchId={matchId} isFinal={isFinal} sport={sport} initial={{
            status: match.status,
            homeScore: match.homeScore,
            awayScore: match.awayScore,
            currentMinute: match.currentMinute,
            currentMinuteNumber: match.currentMinuteNumber,
            homeName: match.homeTeam?.name,
            awayName: match.awayTeam?.name,
            homeBadge: match.homeTeam?.badge,
            awayBadge: match.awayTeam?.badge,
            tournament: match.tournament,
            leagueLogo: match.leagueLogo,
            venue: match.venue,
            dateStr,
            timeStr,
              }} />
            ) : (
              <MatchCountdown timestamp={match.timestamp} status={match.status} />
            )}
          </div>
          <div className="watch-match-meta">
            <div><span>Competition</span><strong>{match.tournament || 'Live fixture'}</strong></div>
            <div><span>Venue</span><strong>{match.venue || 'Venue unavailable'}</strong></div>
            <div><span>Kickoff</span><strong>{dateStr} · {timeStr}</strong></div>
            <div><span>Source</span><strong>{match.provider || 'Hydra Sport'}</strong></div>
          </div>
        </section>

        {/* Match Interval Banners */}
        {isLive && typeof match.homeScore === 'number' && match.currentMinuteNumber >= 90 && (
          <div className="watch-notice watch-notice-amber">
            <p className="text-xs font-black text-amber-800 uppercase tracking-widest">⚠️ Full Time Completed</p>
            <p className="mt-0.5 text-xs text-amber-700 font-medium">The fixture has finished. Streams may terminate soon.</p>
          </div>
        )}

        {isLive && typeof match.homeScore === 'number' && match.currentMinuteNumber === 45 && (
          <div className="watch-notice watch-notice-green">
            <p className="text-xs font-black text-emerald-800 uppercase tracking-widest">⚽ Halftime Interval</p>
            <p className="mt-0.5 text-xs text-emerald-700 font-medium">Teams are in the locker room. The live stream will return shortly.</p>
          </div>
        )}

        {/* Video Player Widescreen Container */}
        <section aria-label="Live Match Player" className="watch-player-card">
          {streamUrl && !errorMsg ? (
            <WatchMatchPlayer matchId={matchId} streamUrl={streamUrl} channels={channels} matchTitle={match.title} matchStatus={match.status} />
          ) : channels.length > 0 ? (
            <WatchMatchPlayer matchId={matchId} streamUrl={streamUrl} channels={channels} matchTitle={match.title} matchStatus={match.status} />
          ) : (
            <div className="flex aspect-video items-center justify-center bg-white p-6">
              <div className="text-center space-y-3 max-w-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 border border-slate-200">
                  <RefreshCw className="h-5 w-5 text-emerald-600 animate-spin" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">Connecting to Stream Feeds</p>
                  {errorMsg ? (
                    <p className="mt-1 text-xs text-slate-500 font-medium">{errorMsg}</p>
                  ) : (
                    <p className="mt-1 text-xs text-slate-500 font-medium">Hydra Sport is resolving stream routes.</p>
                  )}

                  <section className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-left shadow-xs">
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">Upstream match data</h2>
                    <div className="mt-3 grid gap-2.5 text-xs text-slate-600 sm:grid-cols-2 font-medium">
                      <p><span className="text-slate-400 font-bold">Provider:</span> {match.provider || 'WatchFooty'}</p>
                      <p><span className="text-slate-400 font-bold">Category:</span> {match.upstreamCategory || match.sport || 'Football'}</p>
                      <p><span className="text-slate-400 font-bold">Priority:</span> {match.priority || 'Live'}</p>
                      <p><span className="text-slate-400 font-bold">Match ID:</span> {match.id}</p>
                    </div>
                  </section>
                </div>
                <p className="text-[10.5px] text-slate-400 font-semibold">Please reload the page or check back near kick-off.</p>
              </div>
            </div>
          )}
        </section>

        <div className="watch-details-grid">
          <div className="watch-primary-details">
            <MatchEventsSection events={commentary.filter((event) =>
              isFootball
                ? /goal|card|substitution|penalty/i.test(event.type || '')
                : Boolean(event.text || event.type)
            )} />
            <MatchStatsSection teamStats={teamStats} commentary={commentary} homeTeam={match.homeTeam} awayTeam={match.awayTeam} sport={sport} />
          </div>
          <aside className="watch-lineup-details">
            <LineupSection rosters={rosters} homeTeam={match.homeTeam} awayTeam={match.awayTeam} sport={sport} />
          </aside>
        </div>
      </main>
    </div>
  );
}
