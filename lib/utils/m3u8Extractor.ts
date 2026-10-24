import { fetchWithTimeout } from '../providers/baseProvider';
import logger from '../logger';

/**
 * Extracts raw direct HLS (.m3u8) URLs from embed pages, Clappr/JWPlayer configurations,
 * and script blocks so matches can play in the native, 1-click ad-free video player.
 */
export async function extractDirectM3u8FromEmbed(embedUrl: string): Promise<string | null> {
  if (!embedUrl || typeof embedUrl !== 'string') return null;

  // 1. If it's already a direct HLS or MPD stream, return as-is
  if (
    embedUrl.includes('.m3u8') ||
    embedUrl.includes('.mpd') ||
    embedUrl.includes('/hls/') ||
    embedUrl.includes('.mp4')
  ) {
    return embedUrl;
  }

  // Only attempt extraction on valid HTTP/HTTPS web embed URLs
  if (!embedUrl.startsWith('http://') && !embedUrl.startsWith('https://')) {
    return null;
  }

  try {
    let hostname = '';
    try {
      hostname = new URL(embedUrl).hostname;
    } catch {
      hostname = '';
    }

    const headers: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Referer': hostname ? `https://${hostname}/` : 'https://streamed.pk/',
    };

    const res = await fetch(embedUrl, {
      headers,
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) return null;
    const html = await res.text();

    return parseM3u8FromHtml(html, embedUrl);
  } catch (err: any) {
    logger.debug(`M3U8 extraction skipped for ${embedUrl}: ${err?.message || err}`);
    return null;
  }
}

/**
 * Pure parsing logic to extract direct .m3u8 URLs from HTML and script contents
 */
export function parseM3u8FromHtml(html: string, baseUrl?: string): string | null {
  if (!html) return null;

  // Unescape backslashes frequently found in JSON / JS variables: "https:\/\/..." => "https://..."
  const cleanHtml = html.replace(/\\\//g, '/');

  // Strategy 1: Explicit .m3u8 URL pattern
  const directM3u8Regex = /(https?:\/\/[^\s"'<>\\]+?\.m3u8[^\s"'<>\\]*)/i;
  const matchDirect = cleanHtml.match(directM3u8Regex);
  if (matchDirect && matchDirect[1]) {
    const candidate = matchDirect[1].replace(/&amp;/g, '&');
    if (isValidStreamUrl(candidate)) {
      return candidate;
    }
  }

  // Strategy 2: Clappr / JWPlayer source/file pattern with .m3u8
  const playerSourceRegex = /(?:source|file|src|streamUrl|hlsUrl)\s*:\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/i;
  const matchSource = cleanHtml.match(playerSourceRegex);
  if (matchSource && matchSource[1]) {
    const candidate = matchSource[1].replace(/&amp;/g, '&');
    if (isValidStreamUrl(candidate)) {
      return candidate;
    }
  }

  // Strategy 3: Base64-encoded stream URL: atob("aHR0cHM6Ly8...")
  const atobRegex = /atob\s*\(\s*["']([A-Za-z0-9+/=]{20,})["']\s*\)/g;
  let atobMatch;
  while ((atobMatch = atobRegex.exec(cleanHtml)) !== null) {
    try {
      const decoded = Buffer.from(atobMatch[1], 'base64').toString('utf-8');
      if (decoded.includes('.m3u8') && decoded.startsWith('http')) {
        const subMatch = decoded.match(/(https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)/i);
        if (subMatch && isValidStreamUrl(subMatch[1])) {
          return subMatch[1];
        }
      }
    } catch {
      // Ignore base64 decode failures
    }
  }

  // Strategy 4: Relative /hls/ or playlist.m3u8 with baseUrl
  if (baseUrl) {
    const relativeM3u8Regex = /["'](\/[^\s"'<>]+\.m3u8[^\s"'<>]*)["']/i;
    const matchRel = cleanHtml.match(relativeM3u8Regex);
    if (matchRel && matchRel[1]) {
      try {
        const fullUrl = new URL(matchRel[1], baseUrl).toString();
        if (isValidStreamUrl(fullUrl)) {
          return fullUrl;
        }
      } catch {
        // Ignore URL parse failure
      }
    }
  }

  return null;
}

function isValidStreamUrl(url: string): boolean {
  if (!url || !url.startsWith('http')) return false;
  // Discard placeholder scripts or ad networks masquerading as streams
  const lower = url.toLowerCase();
  if (lower.includes('google-analytics') || lower.includes('doubleclick') || lower.includes('adservice')) {
    return false;
  }
  return lower.includes('.m3u8') || lower.includes('/hls/');
}
