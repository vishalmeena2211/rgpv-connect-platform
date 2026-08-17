import { prisma } from '@rgpv/db';

/** The other participant in a one-to-one conversation. */
interface Participant {
  id: string;
  name: string;
  avatarUrl: string | null;
}

/** A conversation row for the inbox list. */
export interface ConversationSummary {
  id: string;
  other: Participant;
  lastMessage: string | null;
  lastMessageAt: string | null;
  isUnread: boolean;
}

/** A single message within a thread. */
export interface ThreadMessage {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
}

/** A full conversation thread, scoped to a member who is allowed to read it. */
export interface ConversationThread {
  id: string;
  other: Participant;
  messages: ThreadMessage[];
}

/** Is a conversation unread for `userId`, given its last message and read cursor? */
function unreadFor(
  userId: string,
  lastMessage: { senderId: string; createdAt: Date } | undefined,
  lastReadAt: Date | null,
): boolean {
  if (!lastMessage || lastMessage.senderId === userId) return false;
  return lastReadAt === null || lastMessage.createdAt > lastReadAt;
}

/** List a user's conversations, most recently active first. */
export async function getConversations(userId: string): Promise<ConversationSummary[]> {
  const conversations = await prisma.conversation.findMany({
    where: { members: { some: { userId } } },
    orderBy: { lastMessageAt: 'desc' },
    select: {
      id: true,
      members: {
        select: {
          userId: true,
          lastReadAt: true,
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { body: true, senderId: true, createdAt: true },
      },
    },
  });

  return conversations.flatMap((conversation) => {
    const self = conversation.members.find((member) => member.userId === userId);
    const other = conversation.members.find((member) => member.userId !== userId);
    if (!other) return [];

    const lastMessage = conversation.messages[0];
    return [
      {
        id: conversation.id,
        other: other.user,
        lastMessage: lastMessage?.body ?? null,
        lastMessageAt: lastMessage?.createdAt.toISOString() ?? null,
        isUnread: unreadFor(userId, lastMessage, self?.lastReadAt ?? null),
      },
    ];
  });
}

/** Load a single thread, or `null` if it doesn't exist or `userId` isn't a member. */
export async function getConversation(
  conversationId: string,
  userId: string,
): Promise<ConversationThread | null> {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, members: { some: { userId } } },
    select: {
      id: true,
      members: {
        where: { userId: { not: userId } },
        select: { user: { select: { id: true, name: true, avatarUrl: true } } },
      },
      messages: {
        orderBy: { createdAt: 'asc' },
        select: { id: true, body: true, senderId: true, createdAt: true },
      },
    },
  });

  const other = conversation?.members[0]?.user;
  if (!conversation || !other) return null;

  return {
    id: conversation.id,
    other,
    messages: conversation.messages.map((message) => ({
      id: message.id,
      body: message.body,
      senderId: message.senderId,
      createdAt: message.createdAt.toISOString(),
    })),
  };
}

/** Count conversations with messages the user hasn't read, for the top-bar badge. */
export async function getUnreadMessageCount(userId: string): Promise<number> {
  const members = await prisma.conversationMember.findMany({
    where: { userId },
    select: {
      lastReadAt: true,
      conversation: {
        select: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { senderId: true, createdAt: true },
          },
        },
      },
    },
  });

  return members.filter((member) =>
    unreadFor(userId, member.conversation.messages[0], member.lastReadAt),
  ).length;
}
