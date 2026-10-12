/**
 * The one public address search engines should list. Canonical links, the
 * sitemap and structured data use it, so a page reached on a preview or
 * deployment address still points search engines at rgpvconnect.co.in.
 * APP_URL overrides it for a self-hosted copy.
 */
export const SITE_URL = (process.env.APP_URL?.trim() || 'https://rgpvconnect.co.in').replace(/\/$/, '');

export const SITE_HOST = new URL(SITE_URL).host;

export const SITE_NAME = 'RGPV Connect';

/** Page-level Open Graph. Next replaces the root's openGraph rather than merging, so site name and locale are repeated. */
export function openGraph(title: string, description: string, url: string, type: 'website' | 'article' = 'website') {
  return {
    type,
    siteName: SITE_NAME,
    locale: 'en_IN',
    title,
    description,
    url,
    // A page's own openGraph drops the root opengraph-image, so the shared card is named again here.
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'RGPV Connect: your RGPV result in ten seconds' }],
  };
}

/** Shown under the title in search results and link previews when a page has nothing more specific. */
export const SITE_DESCRIPTION =
  'Check any RGPV semester result in seconds, free and without signing up. Keep your CGPA trend, find notes and previous year papers by branch and semester, and meet your verified batch.';
