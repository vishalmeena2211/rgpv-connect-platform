'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@rgpv/db';
import { z } from 'zod';

import { getCurrentUser } from '@/lib/session';
import { maskEnrollment } from '@/lib/utils';

const PREFERENCES = ['notifyResults', 'notifyMessages', 'notifyReviews', 'notifySocial', 'showOnBoard'] as const;
export type Preference = (typeof PREFERENCES)[number];

/** Flip one preference switch for the signed-in user. */
export async function setPreference(key: Preference, on: boolean): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user || !PREFERENCES.includes(key)) return { ok: false };
  await prisma.user.update({ where: { id: user.id }, data: { [key]: on } });
  revalidatePath('/settings');
  return { ok: true };
}

const profileSchema = z.object({ bio: z.string().trim().max(280) });

export async function updateBio(_: unknown, formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Sign in first.' };
  const parsed = profileSchema.safeParse({ bio: formData.get('bio') ?? '' });
  if (!parsed.success) return { ok: false, error: 'Keep it under 280 characters.' };
  await prisma.user.update({ where: { id: user.id }, data: { bio: parsed.data.bio || null } });
  revalidatePath(`/u/${user.id}`);
  return { ok: true };
}

/** Seven days to change your mind, then an admin deletes everything. */
const COOLING_DAYS = 7;

export async function requestDeletion(reason: string): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  const existing = await prisma.deletionRequest.findFirst({ where: { userId: user.id, status: 'PENDING' } });
  if (!existing) {
    await prisma.deletionRequest.create({
      data: {
        userId: user.id,
        userLabel: user.enrollmentNumber ? `${user.name} · ${maskEnrollment(user.enrollmentNumber)}` : `${user.name} · ${user.email ?? 'no email'}`,
        reason: reason.trim().slice(0, 500) || null,
        eligibleAt: new Date(Date.now() + COOLING_DAYS * 86_400_000),
      },
    });
  }
  revalidatePath('/settings');
  return { ok: true };
}

export async function cancelDeletion(): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  await prisma.deletionRequest.updateMany({ where: { userId: user.id, status: 'PENDING' }, data: { status: 'CANCELLED' } });
  revalidatePath('/settings');
  return { ok: true };
}
