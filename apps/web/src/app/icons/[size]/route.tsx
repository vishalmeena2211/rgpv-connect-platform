import { ImageResponse } from 'next/og';

import { BrandMarkSvg } from '@/components/brand-mark';

const SIZES = new Set([180, 192, 512]);

/**
 * App icon at 180, 192 or 512 px for the web manifest. Square, with the bars
 * pulled into the middle so Android's round and squircle masks ("maskable")
 * never clip the cap or the first bar.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: raw } = await params;
  const size = Number(raw);
  if (!SIZES.has(size)) return new Response('Not found', { status: 404 });
  return new ImageResponse(<BrandMarkSvg size={size} radius={0} inset={0.18} />, {
    width: size,
    height: size,
    headers: { 'Cache-Control': 'public, max-age=604800, immutable' },
  });
}
