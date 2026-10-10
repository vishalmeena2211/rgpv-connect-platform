import 'server-only';

import { randomBytes } from 'node:crypto';

import { type Prisma, prisma } from '@rgpv/db';

/** What a share card shows. Snapshotted so it never changes after sharing. */
export interface ShareCardData {
  semester: number;
  session: string | null;
  sgpa: number | null;
  cgpa: number | null;
  previousCgpa: number | null;
  /** Null for cards shared without a verified account. */
  name: string | null;
  /** "CS 2028 · UIT-RGPV", or the masked enrollment for anonymous cards. */
  line: string;
  /** "Top 19% in CS 2028", only when the owner chose to show it. */
  rank: string | null;
  verified: boolean;
}

/** URL-safe random token; the enrollment number never appears in a share URL. */
export function newShareToken(): string {
  return randomBytes(9).toString('base64url');
}

export async function createShareCard(params: {
  userId: string | null;
  enrollment: string;
  semester: number;
  showName: boolean;
  showCgpa: boolean;
  showRank: boolean;
  data: ShareCardData;
}): Promise<string> {
  const token = newShareToken();
  await prisma.shareCard.create({
    data: {
      token,
      userId: params.userId,
      enrollment: params.enrollment,
      semester: params.semester,
      showName: params.showName,
      showCgpa: params.showCgpa,
      showRank: params.showRank,
      data: params.data as unknown as Prisma.InputJsonValue,
    },
  });
  return token;
}

export async function getShareCard(token: string): Promise<{ data: ShareCardData; createdAt: Date } | null> {
  if (!/^[A-Za-z0-9_-]{6,32}$/.test(token)) return null;
  const card = await prisma.shareCard.findUnique({ where: { token } });
  if (!card) return null;
  return { data: card.data as unknown as ShareCardData, createdAt: card.createdAt };
}
