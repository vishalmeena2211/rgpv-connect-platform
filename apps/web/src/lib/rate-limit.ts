import 'server-only';

import { createHash } from 'node:crypto';
import { headers } from 'next/headers';

import { prisma } from '@rgpv/db';

/** Outcome of a rate-limit check. */
export type RateLimitResult = { ok: true; remaining: number } | { ok: false; retryAfterSeconds: number };

/**
 * Fixed-window counter stored in Postgres, so it holds across serverless
 * instances without Redis. One upsert per check.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSeconds * 1000);

  const row = await prisma.$transaction(async (tx) => {
    const existing = await tx.rateLimit.findUnique({ where: { key } });
    if (!existing || existing.resetAt <= now) {
      return tx.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, resetAt },
        update: { count: 1, resetAt },
      });
    }
    return tx.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
  });

  if (row.count > limit) {
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((row.resetAt.getTime() - now.getTime()) / 1000)) };
  }
  return { ok: true, remaining: limit - row.count };
}

/**
 * A stable, non-reversible key for the caller's IP. Raw IPs are never stored.
 */
export async function clientKey(): Promise<string> {
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
  return createHash('sha256').update(`rgpv:${ip}`).digest('hex').slice(0, 32);
}
