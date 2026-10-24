import { NextResponse } from 'next/server';
import { getTopFootballNews } from '@/lib/providers/newsProvider';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const articles = await getTopFootballNews();
    return NextResponse.json({ articles }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to retrieve news: ' + err.message, articles: [] },
      { 
        status: 200, // Return 200 with fallback rather than error so client UI does not crash
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  }
}
