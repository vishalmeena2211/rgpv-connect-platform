import { NextResponse } from 'next/server';
import { prisma } from '@rgpv/db';

/** Counts a download, then sends the browser to the file. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resource = await prisma.resource.findFirst({ where: { id, status: 'APPROVED' }, select: { pdfUrl: true } });
  if (!resource) return new NextResponse('Not found', { status: 404 });
  await prisma.resource.update({ where: { id }, data: { downloadCount: { increment: 1 } } });
  return NextResponse.redirect(new URL(resource.pdfUrl, request.url), 302);
}
