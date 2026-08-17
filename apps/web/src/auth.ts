import NextAuth from 'next-auth';
import { prisma } from '@rgpv/db';
import type { VerificationStatus } from '@rgpv/shared';

import { authConfig } from '@/auth.config';

/**
 * Full Auth.js setup (Node runtime).
 *
 * Uses a JWT session strategy: we own the `User` table (it carries the
 * RGPV-specific identity fields), so on sign-in we upsert our user record and
 * mirror the database id + verification status into the token. The token then
 * powers both the session object and the edge middleware guard without extra
 * database round-trips.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: 'jwt' },
  callbacks: {
    ...authConfig.callbacks,

    async jwt({ token, user }) {
      // On first sign-in `user` is set: ensure a DB record exists.
      if (user?.email) {
        const dbUser = await prisma.user.upsert({
          where: { email: user.email },
          update: { name: user.name ?? undefined, avatarUrl: user.image ?? undefined },
          create: {
            email: user.email,
            name: user.name ?? 'RGPV Student',
            avatarUrl: user.image ?? undefined,
          },
        });
        token.userId = dbUser.id;
        token.verificationStatus = dbUser.verificationStatus;
      }

      // Refresh verification status on every call so onboarding completion
      // is reflected without forcing a re-login.
      if (token.userId && !user) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.userId as string },
          select: { verificationStatus: true },
        });
        if (fresh) token.verificationStatus = fresh.verificationStatus;
      }

      return token;
    },

    session({ session, token }) {
      if (token.userId) session.user.id = token.userId as string;
      if (token.verificationStatus) {
        session.user.verificationStatus = token.verificationStatus as VerificationStatus;
      }
      return session;
    },
  },
});
