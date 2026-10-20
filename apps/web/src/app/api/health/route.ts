import { NextResponse } from 'next/server';
import { prisma } from '@rgpv/db';

/**
 * Liveness plus a database ping; also keeps a sleeping free-tier database warm.
 * `dbMs` is one round trip after the connection is open: a few milliseconds
 * when the functions run in the database's region, hundreds when they don't.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const started = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbMs = Math.round(performance.now() - started);
    return NextResponse.json({ status: 'ok', dbMs, region: process.env.VERCEL_REGION ?? null });
  } catch {
    return NextResponse.json({ status: 'database unavailable' }, { status: 503 });
  }
}
