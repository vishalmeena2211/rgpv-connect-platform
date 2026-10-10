import NextAuth from 'next-auth';
import type { EmailConfig } from 'next-auth/providers/email';
import Google from 'next-auth/providers/google';
import type { Provider } from 'next-auth/providers';
import { prisma } from '@rgpv/db';
import type { UserRole, VerificationStatus } from '@rgpv/shared';

import { authConfig } from '@/auth.config';
import { rgpvAdapter } from '@/lib/auth-adapter';
import { sendSignInEmail } from '@/lib/email';

/** Email magic link: primary, because most RGPV students have no college Google account. */
const emailProvider: EmailConfig = {
  id: 'email',
  type: 'email',
  name: 'Email',
  maxAge: 15 * 60,
  normalizeIdentifier: (identifier) => identifier.trim().toLowerCase(),
  async sendVerificationRequest({ identifier, url }) {
    await sendSignInEmail({ to: identifier, url });
  },
};

const providers: Provider[] = [emailProvider];
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  // Google verifies addresses, so linking it to an existing email account is safe.
  providers.push(Google({ allowDangerousEmailAccountLinking: true }));
}

/** Emails listed in ADMIN_EMAILS become admins on sign-in. */
function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * Full Auth.js setup (Node runtime).
 *
 * JWT sessions: the token carries our user id, verification status and role so
 * the edge middleware can guard routes without a database round-trip. The
 * adapter stores users, linked Google accounts and email sign-in tokens.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: rgpvAdapter(),
  providers,
  session: { strategy: 'jwt' },
  events: {
    async signIn({ user }) {
      const email = user.email?.toLowerCase();
      if (email && adminEmails().has(email)) {
        await prisma.user.updateMany({ where: { email, role: { not: 'ADMIN' } }, data: { role: 'ADMIN' } });
      }
    },
  },
  callbacks: {
    ...authConfig.callbacks,

    async jwt({ token, user }) {
      if (user?.id) token.userId = user.id;

      // Refresh identity fields on every call so verification and role changes
      // apply without signing in again.
      if (token.userId) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.userId as string },
          select: { verificationStatus: true, role: true },
        });
        if (!fresh) return null;
        token.verificationStatus = fresh.verificationStatus;
        token.role = fresh.role;
      }
      return token;
    },

    session({ session, token }) {
      if (token.userId) session.user.id = token.userId as string;
      if (token.verificationStatus) session.user.verificationStatus = token.verificationStatus as VerificationStatus;
      if (token.role) session.user.role = token.role as UserRole;
      return session;
    },
  },
});
