import { NextRequest, NextResponse } from 'next/server';
import { getStandingsForLeague } from '@/lib/providers/standingsProvider';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const league = searchParams.get('league') || 'serie a';

  try {
    const data = await getStandingsForLeague(league);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to retrieve standings: ' + err.message, entries: [] },
      { 
        status: 200, // Return 200 with fallback rather than 500 error
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  }
}
