import { NextResponse } from 'next/server';

import { env } from '@/lib/env';
import { ALLOWED_TYPES, MAX_UPLOAD_BYTES, verifyLocalUpload, writeLocal } from '@/lib/storage';

export const runtime = 'nodejs';

/**
 * Local-storage upload target (development, or self-hosting without a bucket).
 * Only accepts a PUT carrying a signature this server issued in the last ten
 * minutes for exactly this key and content type.
 */
export async function PUT(request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  if (env.STORAGE_DRIVER !== 'local') return new NextResponse('Not found', { status: 404 });
  const { key: parts } = await params;
  const key = parts.join('/');
  const url = new URL(request.url);
  const contentType = request.headers.get('content-type') ?? '';
  const expires = Number(url.searchParams.get('expires'));
  const signature = url.searchParams.get('signature') ?? '';

  if (!(contentType in ALLOWED_TYPES) || !verifyLocalUpload(key, expires, contentType, signature)) {
    return new NextResponse('Upload link expired or invalid', { status: 403 });
  }
  const body = Buffer.from(await request.arrayBuffer());
  if (body.length === 0 || body.length > MAX_UPLOAD_BYTES) {
    return new NextResponse('File too large', { status: 413 });
  }
  await writeLocal(key, body);
  return new NextResponse(null, { status: 204 });
}
