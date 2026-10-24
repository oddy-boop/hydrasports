import { NextRequest, NextResponse } from 'next/server';
import { getCacheManager } from '@/lib/cache/cacheManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawNames = searchParams.get('names') || '';
  if (!rawNames.trim()) {
    return NextResponse.json({ faces: {} });
  }

  const names = rawNames
    .split(',')
    .map(n => n.trim())
    .filter(Boolean);

  if (names.length === 0) {
    return NextResponse.json({ faces: {} });
  }

  const cache = getCacheManager();
  const faces: Record<string, string> = {};
  const missingNames: string[] = [];

  // Check cache first for each name
  for (const name of names) {
    const key = `face_${name.toLowerCase().trim()}`;
    const cached = await cache.get<string>(key);
    if (cached) {
      faces[name.toLowerCase()] = cached;
    } else {
      missingNames.push(name);
    }
  }

  if (missingNames.length > 0) {
    try {
      // Wikipedia allows up to 50 titles per query separated by %7C (|)
      const titles = missingNames
        .slice(0, 50)
        .map(n => encodeURIComponent(n.trim().replace(/\s+/g, '_')))
        .join('%7C');

      const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${titles}&prop=pageimages&format=json&pithumbsize=250&redirects=1`;
      
      const res = await fetch(url, {
        cache: 'no-store',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        const pages = data.query?.pages || {};
        const redirects = data.query?.redirects || [];
        const redirectFromMap: Record<string, string[]> = {};
        for (const r of redirects) {
          const toKey = r.to.toLowerCase();
          if (!redirectFromMap[toKey]) redirectFromMap[toKey] = [];
          redirectFromMap[toKey].push(r.from.toLowerCase());
        }

        for (const page of Object.values(pages) as any[]) {
          const imgUrl = page.thumbnail?.source;
          const pageTitle = page.title;
          if (imgUrl && pageTitle) {
            const pageLower = pageTitle.toLowerCase();
            const fromList = redirectFromMap[pageLower] || [];

            // Match with requested names
            const matchedName = missingNames.find(n => {
              const cleanA = n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
              const cleanB = pageTitle.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
              if (cleanA === cleanB || cleanA.includes(cleanB) || cleanB.includes(cleanA)) return true;
              return fromList.some(f => f.includes(cleanA) || cleanA.includes(f));
            });

            const keysToSet = new Set<string>([pageLower, ...(matchedName ? [matchedName.toLowerCase()] : []), ...fromList]);
            for (const k of keysToSet) {
              faces[k] = imgUrl;
              await cache.set(`face_${k}`, imgUrl, 7 * 24 * 3600); // 7-day cache
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Player face fetch error:', err.message);
    }
  }

  return NextResponse.json({ faces }, {
    headers: {
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
