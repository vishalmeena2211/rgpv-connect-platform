import type { NextAuthConfig } from 'next-auth';

/**
 * Paths anyone can open signed out. Everything else needs a session.
 * Prefix matches, so '/notes' also covers '/notes/abc'.
 */
const PUBLIC_PREFIXES = [
  '/login',
  '/api/auth',
  '/api/share',
  '/api/files',
  '/api/health',
  '/api/cron',
  '/api/resources',
  '/api/result/warm',
  '/result/',
  '/s/',
  '/how-it-works',
  '/privacy',
  '/terms',
  '/notes',
  '/papers',
  '/resources',
  '/manifest.webmanifest',
  '/sitemap.xml',
  '/robots.txt',
  '/opengraph-image',
  '/twitter-image',
  '/sw.js',
  '/samples',
  '/icon',
  '/apple-icon',
  '/icons',
];

export function isPublicPath(pathname: string): boolean {
  return pathname === '/' || PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Edge-safe Auth.js configuration used by the middleware. It only reads the
 * JWT, so providers and the database adapter live in `auth.ts` (Node runtime).
 */
export const authConfig = {
  providers: [],
  trustHost: true,
  pages: {
    signIn: '/login',
    verifyRequest: '/login/check-email',
    error: '/login',
  },
  callbacks: {
    /** Signed-in users may go anywhere; others only to public paths. */
    authorized({ auth, request }) {
      if (isPublicPath(request.nextUrl.pathname)) return true;
      return Boolean(auth?.user);
    },
  },
} satisfies NextAuthConfig;
