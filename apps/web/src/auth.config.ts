import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

/**
 * Edge-safe Auth.js configuration.
 *
 * Contains only what the middleware needs (providers list + the `authorized`
 * guard). Anything requiring Node APIs (Prisma, bcrypt) lives in `auth.ts`.
 */
export const authConfig = {
  providers: [Google],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    /**
     * Route guard used by middleware. Signed-in users may proceed; everyone
     * else is redirected to the sign-in page for protected routes.
     */
    authorized({ auth, request }) {
      const isLoggedIn = Boolean(auth?.user);
      const { pathname } = request.nextUrl;

      const isPublic =
        pathname === '/' ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/api/auth');

      if (isPublic) return true;
      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
