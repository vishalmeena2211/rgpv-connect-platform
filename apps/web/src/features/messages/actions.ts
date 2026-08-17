'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@rgpv/db';

import { getCurrentUser } from '@/lib/session';
import { notify } from '@/features/notifications/notify';

/** Result of sending a message: success, or a human-readable error. */
export type MessageActionResult = { ok: true } | { ok: false; error: string };

const MAX_BODY = 4000;

/**
 * Open a one-to-one conversation with another user, reusing an existing thread
 * when one is already shared, and redirect into it. Used by the "Message"
 * button on profiles.
 */
export async function startConversation(targetUserId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.id === targetUserId) redirect('/messages');

  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { members: { some: { userId: user.id } } },
        { members: { some: { userId: targetUserId } } },
      ],
    },
    select: { id: true },
  });

  const conversationId =
    existing?.id ??
    (
      await prisma.conversation.create({
        data: {
          members: {
            create: [{ userId: user.id }, { userId: targetUserId }],
          },
        },
        select: { id: true },
      })
    ).id;

  redirect(`/messages/${conversationId}`);
}

/**
 * Send a message in a conversation the signed-in user belongs to. Stamps the
 * conversation's activity time, advances the sender's read cursor, and notifies
 * the other participant.
 */
export async function sendMessage(
  conversationId: string,
  body: string,
): Promise<MessageActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'You must be signed in.' };

  const trimmed = body.trim();
  if (!trimmed) return { ok: false, error: 'Write something first.' };
  if (trimmed.length > MAX_BODY) return { ok: false, error: 'Message is too long.' };

  const membership = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId: user.id } },
    select: { id: true },
  });
  if (!membership) return { ok: false, error: 'Conversation not found.' };

  const now = new Date();
  await prisma.$transaction([
    prisma.message.create({
      data: { conversationId, senderId: user.id, body: trimmed },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: now },
    }),
    prisma.conversationMember.update({
      where: { id: membership.id },
      data: { lastReadAt: now },
    }),
  ]);

  const others = await prisma.conversationMember.findMany({
    where: { conversationId, userId: { not: user.id } },
    select: { userId: true },
  });
  await Promise.all(
    others.map((member) =>
      notify({
        recipientId: member.userId,
        actorId: user.id,
        type: 'MESSAGE',
        entityId: conversationId,
      }),
    ),
  );

  revalidatePath(`/messages/${conversationId}`);
  revalidatePath('/messages');
  return { ok: true };
}

/** Advance the signed-in user's read cursor for a conversation. */
export async function markConversationRead(conversationId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  await prisma.conversationMember.updateMany({
    where: { conversationId, userId: user.id },
    data: { lastReadAt: new Date() },
  });

  revalidatePath('/messages');
}
