import { Redis } from '@upstash/redis';

export interface ChatMessage {
  id: string;
  matchId: string;
  userId: string;
  username: string;
  team?: 'home' | 'away' | 'neutral';
  teamName?: string;
  avatar?: string;
  text: string;
  timestamp: number;
  isQuickCheer?: boolean;
}

export function isMatchFinished(status?: string, minute?: string): boolean {
  if (!status && !minute) return false;
  const s = (status || '').toLowerCase().trim();
  const m = (minute || '').toLowerCase().trim();
  return (
    s === 'finished' ||
    s === 'ft' ||
    s === 'post' ||
    s === 'ended' ||
    s === 'completed' ||
    m === 'ft' ||
    m === 'final' ||
    m.includes('full time')
  );
}

// In-memory chat store: Map<matchId, ChatMessage[]>
const chatRooms = new Map<string, ChatMessage[]>();

// In-memory presence store: Map<matchId, Map<viewerId, lastSeenTimestamp>>
const viewerPresence = new Map<string, Map<string, number>>();

const MAX_MESSAGES_PER_ROOM = 100;
const PRESENCE_TIMEOUT_MS = 25000; // 25s window for online viewers

let redisClient: Redis | null = null;
function getRedis(): Redis | null {
  if (redisClient) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (url && token) {
    try {
      redisClient = new Redis({ url, token });
      return redisClient;
    } catch {
      return null;
    }
  }
  return null;
}

export function getChatChannel(matchId: string): string {
  const clean = (matchId || 'match').toLowerCase().replace(/[^a-z0-9_-]/g, '_').slice(0, 50);
  return `hydrasports_chat_${clean}`;
}

export async function broadcastMessage(matchId: string, message: ChatMessage): Promise<void> {
  try {
    const channel = getChatChannel(matchId);
    await fetch(`https://ntfy.sh/${channel}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // Non-blocking real-time broadcast
  }
}

export function getMatchMessages(matchId: string): ChatMessage[] {
  if (!matchId) return [];
  return chatRooms.get(matchId) || [];
}

export async function getMatchMessagesAsync(matchId: string): Promise<ChatMessage[]> {
  if (!matchId) return [];
  const redis = getRedis();
  if (redis) {
    try {
      const items = await redis.lrange<string>(`chat:${matchId}`, 0, -1);
      if (Array.isArray(items) && items.length > 0) {
        return items.map(item => (typeof item === 'string' ? JSON.parse(item) : item));
      }
    } catch {
      // Fallback to in-memory
    }
  }
  return chatRooms.get(matchId) || [];
}

export function addMatchMessage(
  matchId: string,
  payload: {
    userId: string;
    username: string;
    text: string;
    team?: 'home' | 'away' | 'neutral';
    teamName?: string;
    avatar?: string;
    isQuickCheer?: boolean;
  }
): ChatMessage {
  if (!matchId) throw new Error('matchId is required');

  const cleanText = (payload.text || '').trim();
  if (!cleanText) throw new Error('Message cannot be empty');
  if (cleanText.length > 280) throw new Error('Message exceeds 280 character limit');

  const cleanUsername = (payload.username || 'Fan').trim().slice(0, 30);

  const message: ChatMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    matchId,
    userId: payload.userId || 'guest',
    username: cleanUsername,
    team: payload.team || 'neutral',
    teamName: payload.teamName?.trim().slice(0, 40),
    avatar: payload.avatar || '/images/hydra/avatar_naufal.png',
    text: cleanText,
    timestamp: Date.now(),
    isQuickCheer: Boolean(payload.isQuickCheer),
  };

  const existing = chatRooms.get(matchId) || [];
  existing.push(message);

  // Keep last MAX_MESSAGES_PER_ROOM
  if (existing.length > MAX_MESSAGES_PER_ROOM) {
    existing.splice(0, existing.length - MAX_MESSAGES_PER_ROOM);
  }

  chatRooms.set(matchId, existing);

  // Background persist to Upstash Redis if configured
  const redis = getRedis();
  if (redis) {
    redis.rpush(`chat:${matchId}`, JSON.stringify(message))
      .then(() => redis.ltrim(`chat:${matchId}`, -MAX_MESSAGES_PER_ROOM, -1))
      .catch(() => {});
  }

  return message;
}

export function purgeMatchChat(matchId: string): void {
  if (!matchId) return;
  chatRooms.delete(matchId);
  viewerPresence.delete(matchId);
  const redis = getRedis();
  if (redis) {
    redis.del(`chat:${matchId}`).catch(() => {});
    redis.del(`presence:${matchId}`).catch(() => {});
  }
}

export function recordViewerPresence(matchId: string, viewerId: string): number {
  if (!matchId || !viewerId) return 1;

  let roomPresence = viewerPresence.get(matchId);
  if (!roomPresence) {
    roomPresence = new Map<string, number>();
    viewerPresence.set(matchId, roomPresence);
  }

  const now = Date.now();
  roomPresence.set(viewerId, now);

  // Cleanup stale viewers
  for (const [id, seenAt] of roomPresence.entries()) {
    if (now - seenAt > PRESENCE_TIMEOUT_MS) {
      roomPresence.delete(id);
    }
  }

  return Math.max(1, roomPresence.size);
}

export function getViewerCount(matchId: string): number {
  if (!matchId) return 1;
  const roomPresence = viewerPresence.get(matchId);
  if (!roomPresence) return 1;

  const now = Date.now();
  let count = 0;
  for (const seenAt of roomPresence.values()) {
    if (now - seenAt <= PRESENCE_TIMEOUT_MS) {
      count++;
    }
  }
  return Math.max(1, count);
}
