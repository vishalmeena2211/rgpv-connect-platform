'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@rgpv/db';
import { z } from 'zod';

import { notify } from '@/features/notifications/notify';
import { rateLimit } from '@/lib/rate-limit';
import { getCurrentUser, isVerified } from '@/lib/session';

export type PostActionResult = { ok: true } | { ok: false; error: string };

const MAX_BODY = 2000;
/** Open reports that hide a post until a reviewer decides. */
const HIDE_AT_REPORTS = 3;

/** Post to your college, or to one of your groups (your batch). Verified only. */
export async function createPost(body: string, groupId: string | null): Promise<PostActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Sign in first.' };
  if (!isVerified(user) || !user.collegeId) return { ok: false, error: 'Verify your enrollment to post.' };
  if (user.postingSuspendedUntil && user.postingSuspendedUntil > new Date()) {
    return { ok: false, error: `Posting is paused for your account until ${user.postingSuspendedUntil.toLocaleDateString('en-IN')}.` };
  }
  const trimmed = body.trim();
  if (!trimmed) return { ok: false, error: 'Write something first.' };
  if (trimmed.length > MAX_BODY) return { ok: false, error: 'Keep it under 2,000 characters.' };
  const limit = await rateLimit(`post:${user.id}`, 20, 3600);
  if (!limit.ok) return { ok: false, error: 'You are posting a lot. Take a short break.' };

  if (groupId) {
    const member = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId: user.id } } });
    if (!member) return { ok: false, error: 'You are not in that group.' };
  }

  await prisma.post.create({
    data: { authorId: user.id, body: trimmed, scope: groupId ? 'GROUP' : 'COLLEGE', collegeId: user.collegeId, groupId },
  });
  revalidatePath('/feed');
  return { ok: true };
}

/** Like or unlike; one like per person, kept in step with the count. */
export async function toggleLike(postId: string): Promise<{ ok: boolean; liked: boolean; count: number }> {
  const user = await getCurrentUser();
  if (!user || !isVerified(user)) return { ok: false, liked: false, count: 0 };

  const existing = await prisma.postLike.findUnique({ where: { postId_userId: { postId, userId: user.id } } });
  const post = await prisma.$transaction(async (tx) => {
    if (existing) {
      await tx.postLike.delete({ where: { postId_userId: { postId, userId: user.id } } });
      return tx.post.update({ where: { id: postId }, data: { likeCount: { decrement: 1 } }, select: { likeCount: true, authorId: true } });
    }
    await tx.postLike.create({ data: { postId, userId: user.id } });
    return tx.post.update({ where: { id: postId }, data: { likeCount: { increment: 1 } }, select: { likeCount: true, authorId: true } });
  });
  if (!existing) await notify({ recipientId: post.authorId, actorId: user.id, type: 'POST_LIKE', entityId: postId });
  return { ok: true, liked: !existing, count: post.likeCount };
}

const reportSchema = z.object({
  reason: z.enum(['OFF_TOPIC', 'SPAM', 'HARASSMENT', 'PERSONAL_INFO', 'OTHER']),
  note: z.string().trim().max(500).optional(),
});

/**
 * Report a post. The reporter is never shown to the author. At three open
 * reports the post is hidden until a reviewer restores or removes it.
 */
export async function reportPost(postId: string, input: z.input<typeof reportSchema>): Promise<PostActionResult> {
  const user = await getCurrentUser();
  if (!user || !isVerified(user)) return { ok: false, error: 'Verify your enrollment to report.' };
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Pick a reason.' };
  const limit = await rateLimit(`report:${user.id}`, 20, 86_400);
  if (!limit.ok) return { ok: false, error: 'You have sent a lot of reports today.' };

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true, hiddenAt: true } });
  if (!post) return { ok: false, error: 'That post is gone.' };
  if (post.authorId === user.id) return { ok: false, error: 'You cannot report your own post.' };

  await prisma.report.upsert({
    where: { reporterId_postId: { reporterId: user.id, postId } },
    create: { reporterId: user.id, postId, reason: parsed.data.reason, note: parsed.data.note || null },
    update: { reason: parsed.data.reason, note: parsed.data.note || null },
  });
  const open = await prisma.report.count({ where: { postId, status: 'OPEN' } });
  if (open >= HIDE_AT_REPORTS && !post.hiddenAt) {
    await prisma.post.update({ where: { id: postId }, data: { hiddenAt: new Date() } });
  }
  revalidatePath('/feed');
  return { ok: true };
}
