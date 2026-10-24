import { describe, it, expect } from 'vitest';
import { parseM3u8FromHtml, extractDirectM3u8FromEmbed } from './m3u8Extractor';

describe('m3u8Extractor utility', () => {
  it('detects already direct HLS streams and returns them immediately', async () => {
    const directUrl = 'https://cdn.example.com/live/playlist.m3u8';
    const result = await extractDirectM3u8FromEmbed(directUrl);
    expect(result).toBe(directUrl);
  });

  it('extracts direct .m3u8 URLs from standard script blocks in HTML', () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <body>
          <div id="player"></div>
          <script>
            var player = new Clappr.Player({
              source: "https://edge12.streamhost.live/hls/football_720p/index.m3u8?token=xyz123",
              parentId: "#player"
            });
          </script>
        </body>
      </html>
    `;

    const extracted = parseM3u8FromHtml(mockHtml);
    expect(extracted).toBe('https://edge12.streamhost.live/hls/football_720p/index.m3u8?token=xyz123');
  });

  it('handles JSON-escaped slashes inside embed scripts', () => {
    const mockHtml = `
      <script>
        window.config = {
          "file": "https:\\/\\/cdn-live.sportsstream.tv\\/live\\/stream_master.m3u8"
        };
      </script>
    `;

    const extracted = parseM3u8FromHtml(mockHtml);
    expect(extracted).toBe('https://cdn-live.sportsstream.tv/live/stream_master.m3u8');
  });

  it('unpacks Base64-encoded stream URLs', () => {
    // atob("aHR0cHM6Ly9zdHJlYW0ubmV0d29yay5jb20vaGxzL2xpdmUucGxheWxpc3QubTN1OA==") => "https://stream.network.com/hls/live.playlist.m3u8"
    const b64 = Buffer.from('https://stream.network.com/hls/live.playlist.m3u8').toString('base64');
    const mockHtml = `
      <script>
        var streamSrc = atob("${b64}");
        initPlayer(streamSrc);
      </script>
    `;

    const extracted = parseM3u8FromHtml(mockHtml);
    expect(extracted).toBe('https://stream.network.com/hls/live.playlist.m3u8');
  });

  it('resolves relative /hls/... paths using the baseUrl', () => {
    const mockHtml = `
      <script>
        var videoUrl = "/hls/feed_primary.m3u8";
      </script>
    `;

    const extracted = parseM3u8FromHtml(mockHtml, 'https://embed.mysports.net/watch/123');
    expect(extracted).toBe('https://embed.mysports.net/hls/feed_primary.m3u8');
  });

  it('returns null if no direct HLS stream is found in the page', () => {
    const mockHtml = '<html><body><div>No stream here</div></body></html>';
    const extracted = parseM3u8FromHtml(mockHtml);
    expect(extracted).toBeNull();
  });
});
