import { fetchWithTimeout } from './baseProvider';
import { getCacheManager } from '../cache/cacheManager';
import logger from '../logger';

export interface NewsArticle {
  id: string;
  headline: string;
  description: string;
  image: string;
  published: string;
  link: string;
}

export async function getTopFootballNews(): Promise<NewsArticle[]> {
  const cache = getCacheManager();
  return cache.swr('top_football_news', async () => {
    try {
      const url = 'https://site.api.espn.com/apis/site/v2/sports/soccer/all/news';
      const data = await fetchWithTimeout(url, 5000);
      if (!data || !Array.isArray(data.articles)) throw new Error('No news articles');

      const articles: NewsArticle[] = data.articles
        .filter((a: any) => Boolean(a.headline && a.images?.[0]?.url))
        .map((a: any, idx: number) => ({
          id: String(a.id || idx),
          headline: a.headline || 'Football News Update',
          description: a.description || '',
          image: a.images?.[0]?.url || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800',
          published: a.published || new Date().toISOString(),
          link: a.links?.web?.href || '#',
        }));

      return articles.slice(0, 8);
    } catch (err: any) {
      logger.error('Failed to fetch real football news from ESPN', { error: err.message });
      return [];
    }
  }, 600); // 10 minutes cache
}
