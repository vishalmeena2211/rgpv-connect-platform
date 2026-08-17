'use server';

import { revalidatePath } from 'next/cache';
import { type PostScope } from '@rgpv/shared';
import { prisma } from '@rgpv/db';

import { getCurrentUser, isVerified } from '@/lib/session';
import { notify } from '@/features/notifications/notify';

/** Result of a post mutation: success, or a human-readable error. */
export type PostActionResult = { ok: true } | { ok: false; error: string };

const MAX_BODY = 2000;

/**
 * Create a post authored by the signed-in (verified) user. COLLEGE-scoped
 * posts are stamped with the author's college so the feed query can target
 * them; verification is required to keep the network tied to real students.
 */
export async function createPost(body: string, scope: PostScope): Promise<PostActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'You must be signed in.' };
  if (!isVerified(user)) return { ok: false, error: 'Verify your enrollment to post.' };

  const trimmed = body.trim();
  if (!trimmed) return { ok: false, error: 'Write something first.' };
  if (trimmed.length > MAX_BODY) return { ok: false, error: 'Post is too long.' };

  await prisma.post.create({
    data: {
      authorId: user.id,
      body: trimmed,
      scope,
      collegeId: scope === 'COLLEGE' ? user.collegeId : null,
    },
  });

  revalidatePath('/feed');
  return { ok: true };
}

/** Increment a post's like counter. Idempotency is intentionally not enforced
 * here — a dedicated Like join table is a later enhancement. */
export async function likePost(postId: string): Promise<PostActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'You must be signed in.' };

  const post = await prisma.post.update({
    where: { id: postId },
    data: { likeCount: { increment: 1 } },
    select: { authorId: true },
  });

  await notify({
    recipientId: post.authorId,
    actorId: user.id,
    type: 'POST_LIKE',
    entityId: postId,
  });

  revalidatePath('/feed');
  return { ok: true };
}
