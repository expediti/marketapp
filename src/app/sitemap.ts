import type { MetadataRoute } from 'next';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://marketmyidea.online';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '',
    '/discover',
    '/how-it-works',
    '/pricing',
    '/for-businesses',
    '/for-creators',
    '/about',
    '/contact',
    '/terms',
    '/privacy',
    '/refund-policy',
    '/delete-account',
    '/auth/login',
    '/auth/signup',
  ];

  const now = new Date();

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === '' || route === '/discover' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : route === '/discover' ? 0.9 : 0.7,
  }));
}
