import { NextRequest, NextResponse } from 'next/server';
import { getLiveMatchDetails, getMatchStatsForMatch } from '@/lib/streamEngine';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  try {
    const match = await getLiveMatchDetails(matchId);
    if (!match) {
      return NextResponse.json({ match: null }, { status: 404 });
    }

    let stats = null;
    try {
      stats = await getMatchStatsForMatch(match);
    } catch {
      // stats optional
    }

    const dateStr = new Date(match.timestamp).toLocaleDateString([], {
      weekday: 'short', month: 'short', day: 'numeric',
    });
    const timeStr = new Date(match.timestamp).toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit',
    });

    return NextResponse.json({
      match: {
        id: match.id,
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
      },
      stats,
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Unable to load match data. Please try again.' }, { status: 500 });
  }
}

