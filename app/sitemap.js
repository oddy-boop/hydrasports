import { getMatches } from '@/lib/streamEngine';

export const revalidate = 300; // Refresh sitemap cache every 5 minutes

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hydrasports.selamate.com';
  const now = new Date();

  // Static core routes with priorities
  const staticRoutes = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: 'always',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/schedule`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/multistream`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/competitions`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/results`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  // Dynamic live and upcoming match routes
  let matchRoutes = [];
  try {
    const matches = await getMatches();
    if (Array.isArray(matches) && matches.length > 0) {
      matchRoutes = matches.map((match) => ({
        url: `${baseUrl}/watch/${match.id}`,
        lastModified: match.timestamp ? new Date(match.timestamp) : now,
        changeFrequency: match.status === 'live' ? 'always' : 'hourly',
        priority: match.status === 'live' ? 0.95 : 0.85,
      }));
    }
  } catch {
    // If upstream matches fail, sitemap returns static routes cleanly
  }

  return [...staticRoutes, ...matchRoutes];
}
