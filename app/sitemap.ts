import type { MetadataRoute } from 'next';
import { blogArticles, programmaticSeoPages, publicSeoRoutes, siteUrl } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = new Set([
    ...publicSeoRoutes,
    ...blogArticles.map((article) => `/blog/${article.slug}`),
    ...programmaticSeoPages.map((page) => `/${page.slug}`),
  ]);

  return Array.from(routes).map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === '/' ? 'weekly' : 'monthly',
    priority: route === '/' ? 1 : route.startsWith('/blog/') ? 0.7 : 0.8,
  }));
}
