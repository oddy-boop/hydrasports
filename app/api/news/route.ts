import { NextResponse } from 'next/server';
import { getTopFootballNews } from '@/lib/providers/newsProvider';

export const revalidate = 600;

export async function GET() {
  try {
    const articles = await getTopFootballNews();
    return NextResponse.json({ articles });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to retrieve news: ' + err.message, articles: [] },
      { status: 500 }
    );
  }
}
