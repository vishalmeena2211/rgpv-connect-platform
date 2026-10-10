import { NextResponse } from 'next/server';

import { env } from '@/lib/env';
import { readLocal } from '@/lib/storage';

export const runtime = 'nodejs';

const TYPES: Record<string, string> = { pdf: 'application/pdf', jpg: 'image/jpeg', png: 'image/png' };

/** Serves locally stored uploads. With S3 storage, files come from the bucket instead. */
export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  if (env.STORAGE_DRIVER !== 'local') return new NextResponse('Not found', { status: 404 });
  const { key: parts } = await params;
  const key = parts.join('/');
  const body = await readLocal(key);
  if (!body) return new NextResponse('Not found', { status: 404 });
  const ext = key.split('.').pop() ?? '';
  return new NextResponse(new Uint8Array(body), {
    headers: {
      'content-type': TYPES[ext] ?? 'application/octet-stream',
      'cache-control': 'public, max-age=31536000, immutable',
      'x-content-type-options': 'nosniff',
      'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; img-src 'self'",
    },
  });
}
