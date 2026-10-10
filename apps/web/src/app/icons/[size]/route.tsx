import { ImageResponse } from 'next/og';

const SIZES = new Set([180, 192, 512]);

/** App icon: the teal tile with the white square, at 180, 192 or 512 px. */
export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: raw } = await params;
  const size = Number(raw);
  if (!SIZES.has(size)) return new Response('Not found', { status: 404 });
  const square = Math.round(size * 0.34);
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F8A6F' }}>
        <div style={{ width: square, height: square, borderRadius: Math.round(square * 0.28), background: '#FFFFFF' }} />
      </div>
    ),
    { width: size, height: size, headers: { 'Cache-Control': 'public, max-age=604800, immutable' } },
  );
}
