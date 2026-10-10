import { NextResponse } from 'next/server';
import { prisma } from '@rgpv/db';

import { advanceDeclaration } from '@/features/admin/results-day';
import { env } from '@/lib/env';

export const maxDuration = 60;

/**
 * Carries on a running results-day declaration when nobody has the admin page
 * open. Schedule it every minute (Vercel Cron sends CRON_SECRET as a bearer).
 */
export async function GET(request: Request) {
  if (!env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  const run = await prisma.resultsDeclaration.findFirst({ where: { status: 'RUNNING' }, select: { id: true } });
  if (!run) return NextResponse.json({ running: false });
  const started = Date.now();
  let more = true;
  // Stay well inside the function time limit; each step is a few portal fetches.
  while (more && Date.now() - started < 40_000) more = await advanceDeclaration(run.id);
  return NextResponse.json({ running: more });
}
