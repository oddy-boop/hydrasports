import { NextRequest, NextResponse } from 'next/server';
import { getStandingsForLeague } from '@/lib/providers/standingsProvider';

export const revalidate = 300;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const league = searchParams.get('league') || 'serie a';

  try {
    const data = await getStandingsForLeague(league);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to retrieve standings: ' + err.message, entries: [] },
      { status: 500 }
    );
  }
}
