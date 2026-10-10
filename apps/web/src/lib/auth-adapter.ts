import 'server-only';

import type { Adapter, AdapterAccount, AdapterUser } from 'next-auth/adapters';

import { type User, prisma } from '@rgpv/db';

/**
 * A small Auth.js adapter over our own User table.
 *
 * The stock Prisma adapter expects `image` and an optional `name`; our User
 * keeps `avatarUrl` and a required `name` alongside the RGPV identity fields.
 * Sessions are JWTs, so only users, OAuth accounts and email sign-in tokens
 * are needed.
 */
function toAdapterUser(user: User): AdapterUser {
  return {
    id: user.id,
    email: user.email ?? '',
    emailVerified: user.emailVerified,
    name: user.name,
    image: user.avatarUrl,
  };
}

/** A name for a brand-new email-only account, from the address itself. */
function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? 'student';
  const words = local.replace(/[._\-+0-9]+/g, ' ').trim();
  if (!words) return 'RGPV Student';
  return words
    .split(/\s+/)
    .map((word) => word[0]!.toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function rgpvAdapter(): Adapter {
  return {
    async createUser(user) {
      const email = user.email.toLowerCase();
      const created = await prisma.user.create({
        data: {
          email,
          emailVerified: user.emailVerified,
          name: user.name?.trim() || nameFromEmail(email),
          avatarUrl: user.image ?? null,
        },
      });
      return toAdapterUser(created);
    },

    async getUser(id) {
      const user = await prisma.user.findUnique({ where: { id } });
      return user ? toAdapterUser(user) : null;
    },

    async getUserByEmail(email) {
      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      return user ? toAdapterUser(user) : null;
    },

    async getUserByAccount({ provider, providerAccountId }) {
      const account = await prisma.account.findUnique({
        where: { provider_providerAccountId: { provider, providerAccountId } },
        include: { user: true },
      });
      return account ? toAdapterUser(account.user) : null;
    },

    async updateUser({ id, emailVerified, name, image }) {
      const existing = await prisma.user.findUniqueOrThrow({ where: { id } });
      const updated = await prisma.user.update({
        where: { id },
        data: {
          ...(emailVerified !== undefined ? { emailVerified } : {}),
          // A verified student's name comes from RGPV; never let a provider overwrite it.
          ...(name && existing.verificationStatus !== 'VERIFIED' ? { name } : {}),
          ...(image && !existing.avatarUrl ? { avatarUrl: image } : {}),
        },
      });
      return toAdapterUser(updated);
    },

    async deleteUser(id) {
      await prisma.user.delete({ where: { id } });
    },

    async linkAccount(account: AdapterAccount) {
      await prisma.account.create({
        data: {
          userId: account.userId,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          refresh_token: account.refresh_token ?? null,
          access_token: account.access_token ?? null,
          expires_at: account.expires_at ?? null,
          token_type: account.token_type ?? null,
          scope: account.scope ?? null,
          id_token: account.id_token ?? null,
          session_state: typeof account.session_state === 'string' ? account.session_state : null,
        },
      });
    },

    async unlinkAccount({ provider, providerAccountId }) {
      await prisma.account.delete({
        where: { provider_providerAccountId: { provider, providerAccountId } },
      });
    },

    async createVerificationToken(token) {
      await prisma.verificationToken.create({ data: token });
      return token;
    },

    async useVerificationToken({ identifier, token }) {
      try {
        return await prisma.verificationToken.delete({
          where: { identifier_token: { identifier, token } },
        });
      } catch {
        // Already used or never existed: Auth.js shows the "link expired" page.
        return null;
      }
    },
  };
}
