import { NextRequest, NextResponse } from 'next/server';
import { getCacheManager } from '@/lib/cache/cacheManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || '';
  const name = searchParams.get('name') || '';

  if (!id && !name) {
    return NextResponse.json({ success: false, error: 'No id or name provided' }, { status: 400 });
  }

  const cache = getCacheManager();
  const cacheKey = `profile_${id || name.toLowerCase().trim()}`;
  const cached = await cache.get<any>(cacheKey);
  if (cached) {
    return NextResponse.json({ success: true, profile: cached });
  }

  // 1. If numeric ESPN athlete ID is provided, query ESPN Core API
  if (/^\d+$/.test(id)) {
    try {
      const res = await fetch(`https://sports.core.api.espn.com/v2/sports/soccer/athletes/${id}`, {
        cache: 'no-store',
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      if (res.ok) {
        const d = await res.json();
        const profile = {
          name: d.displayName || d.fullName || name,
          age: typeof d.age === 'number' ? d.age : undefined,
          dateOfBirth: d.dateOfBirth ? d.dateOfBirth.slice(0, 10) : undefined,
          height: d.displayHeight || undefined,
          weight: d.displayWeight || undefined,
          citizenship: d.citizenship || undefined,
          position: d.position?.displayName || undefined,
          jersey: d.jersey ? String(d.jersey) : undefined,
        };
        await cache.set(cacheKey, profile, 86400); // cache for 24 hours
        return NextResponse.json({ success: true, profile });
      }
    } catch {
      // Fallback below
    }
  }

  return NextResponse.json({ success: false, message: 'Profile not found on ESPN' });
}
