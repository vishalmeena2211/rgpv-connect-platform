import { cache } from 'react';

import { prisma } from '@rgpv/db';

import { auth } from '@/auth';

/** The subset of the current user loaded for UI personalisation and scoping. */
export type CurrentUser = NonNullable<Awaited<ReturnType<typeof loadUser>>>;

const loadUser = cache(async (userId: string) =>
  prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      enrollmentNumber: true,
      verificationStatus: true,
      collegeId: true,
      branchCode: true,
      graduatingBatch: true,
      role: true,
    },
  }),
);

/**
 * Resolve the signed-in user's database record, or `null` if signed out.
 * Memoised per-request via React `cache` so multiple server components can call
 * it without extra queries.
 */
export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return loadUser(session.user.id);
}

/** Convenience: a verified user is one bound to an RGPV enrollment number. */
export function isVerified(user: { verificationStatus: string } | null): boolean {
  return user?.verificationStatus === 'VERIFIED';
}
