import { NextRequest, NextResponse } from 'next/server';
import { getMatchDetails } from '@/lib/streamEngine';
import {
  getMatchMessagesAsync,
  addMatchMessage,
  broadcastMessage,
  purgeMatchChat,
  recordViewerPresence,
  getViewerCount,
  isMatchFinished,
} from '@/lib/chatStorage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Rate limiting in-memory map: Map<ipOrUserId, lastPostTimestamp>
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 1000; // 1 second cooldown between messages

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  if (!matchId) {
    return NextResponse.json({ error: 'Missing matchId' }, { status: 400 });
  }

  try {
    const match = await getMatchDetails(matchId);
    const finished = isMatchFinished(match?.status, match?.currentMinute);

    // If match reached FT / finished: Close room and purge messages
    if (finished) {
      purgeMatchChat(matchId);
      return NextResponse.json(
        {
          messages: [],
          isClosed: true,
          status: 'finished',
          viewerCount: 0,
          reason: 'Match has ended (Full Time). Live stadium chat is closed and messages have been cleared.',
        },
        {
          headers: { 'Cache-Control': 'no-store, max-age=0' },
        }
      );
    }

    // Ongoing or upcoming match: record viewer presence
    const { searchParams } = new URL(request.url);
    const viewerId = searchParams.get('viewerId') || request.headers.get('x-forwarded-for') || 'guest';
    const viewerCount = recordViewerPresence(matchId, viewerId);
    const messages = await getMatchMessagesAsync(matchId);

    return NextResponse.json(
      {
        messages,
        isClosed: false,
        status: match?.status || 'live',
        viewerCount: Math.max(1, viewerCount),
      },
      {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to retrieve match chat' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  if (!matchId) {
    return NextResponse.json({ error: 'Missing matchId' }, { status: 400 });
  }

  try {
    const match = await getMatchDetails(matchId);
    const finished = isMatchFinished(match?.status, match?.currentMinute);

    if (finished) {
      purgeMatchChat(matchId);
      return NextResponse.json(
        {
          error: 'Match has ended (Full Time). Chat room is closed and messages have been deleted.',
          isClosed: true,
        },
        { status: 403 }
      );
    }

    // Rate limiting check
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 'ip_anon';
    const now = Date.now();
    const lastPost = rateLimitMap.get(clientIp) || 0;
    if (now - lastPost < RATE_LIMIT_WINDOW_MS) {
      return NextResponse.json(
        { error: 'Please wait a moment before sending another message.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { text, username, team, teamName, avatar, userId, isQuickCheer } = body || {};

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Message cannot be empty.' }, { status: 400 });
    }

    const message = addMatchMessage(matchId, {
      userId: userId || clientIp,
      username: username || 'Sports Fan',
      text,
      team: team || 'neutral',
      teamName: teamName || '',
      avatar: avatar || '/images/hydra/avatar_naufal.png',
      isQuickCheer: Boolean(isQuickCheer),
    });

    rateLimitMap.set(clientIp, now);

    // Broadcast in real-time to global match channel so all online visitors receive it immediately
    await broadcastMessage(matchId, message);

    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to post message' },
      { status: 400 }
    );
  }
}
