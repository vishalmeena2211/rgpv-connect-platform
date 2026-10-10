import { NextResponse } from 'next/server';
import { prisma } from '@rgpv/db';

/** Liveness plus a database ping; also keeps a sleeping free-tier database warm. */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok' });
  } catch {
    return NextResponse.json({ status: 'database unavailable' }, { status: 503 });
  }
}
