import 'server-only';

import { cache } from 'react';
import { notFound, redirect } from 'next/navigation';

import { prisma } from '@rgpv/db';

import { auth } from '@/auth';

const loadUser = cache(async (userId: string) =>
  prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      enrollmentNumber: true,
      verificationStatus: true,
      collegeId: true,
      college: { select: { code: true, name: true, shortName: true } },
      branchCode: true,
      admissionYear: true,
      graduatingBatch: true,
      role: true,
      showOnBoard: true,
      postingSuspendedUntil: true,
    },
  }),
);

/** The signed-in user's record, loaded for UI personalisation and scoping. */
export type CurrentUser = NonNullable<Awaited<ReturnType<typeof loadUser>>>;

/**
 * Resolve the signed-in user's database record, or `null` if signed out.
 * Memoised per request via React `cache` so many components can call it.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;
  return loadUser(session.user.id);
});

/** A verified user is one bound to an RGPV enrollment number. */
export function isVerified(user: { verificationStatus: string } | null): boolean {
  return user?.verificationStatus === 'VERIFIED';
}

/** For pages behind sign-in: the user, or a redirect to sign in. */
export async function requireUser(callbackPath?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(callbackPath ? `/login?callbackUrl=${encodeURIComponent(callbackPath)}` : '/login');
  return user;
}

/** For admin pages: anyone else gets a plain 404, so the area is not advertised. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') notFound();
  return user;
}
