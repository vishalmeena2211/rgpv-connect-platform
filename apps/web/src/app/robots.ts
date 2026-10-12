import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/lib/site';

/**
 * What search engines may fetch. Signed-in pages are listed here so crawlers
 * skip them; they would only be sent to the login page anyway. Pages that must
 * stay out of results but can be fetched (a shared result, the login page) say
 * "noindex" themselves instead, because a page blocked here cannot be read and
 * its "noindex" would never be seen. Hosts other than rgpvconnect.co.in get a
 * noindex header from next.config.mjs.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin',
        '/feed',
        '/groups',
        '/jobs',
        '/market',
        '/me',
        '/messages',
        '/network',
        '/notifications',
        '/onboarding',
        '/results/me',
        '/search',
        '/settings',
        '/u/',
        '/uploads',
        '/welcome',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
