import { NextResponse } from 'next/server';
import { prisma } from '@rgpv/db';

/** Counts an apply click, then sends the student to the recruiter's page. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await prisma.jobPost.findUnique({ where: { id }, select: { applyUrl: true } });
  if (!job || !/^https?:\/\//.test(job.applyUrl)) return new NextResponse('Not found', { status: 404 });
  await prisma.jobPost.update({ where: { id }, data: { applyClicks: { increment: 1 } } });
  return NextResponse.redirect(job.applyUrl, 302);
}
