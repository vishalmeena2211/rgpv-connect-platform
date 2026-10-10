import { ImageResponse } from 'next/og';

import { getShareCard } from '@/features/results/share';

export const runtime = 'nodejs';

/**
 * The share card as a 1200×630 PNG: the Open Graph image WhatsApp shows, and
 * the "Save image" download. Colours are the brand ink gradient and teal.
 */
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const card = await getShareCard(token);
  if (!card) return new Response('Not found', { status: 404 });
  const { data } = card;
  const change = data.cgpa != null && data.previousCgpa != null ? data.cgpa - data.previousCgpa : null;

  const image = new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          color: '#FFFFFF',
          backgroundImage: 'radial-gradient(700px 420px at 100% 0%, rgba(15,138,111,0.45), transparent 70%), linear-gradient(135deg, #0F2A24 0%, #16453A 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 30, opacity: 0.85 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontWeight: 700 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#0F8A6F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 16, height: 16, borderRadius: 4, background: '#FFFFFF' }} />
            </div>
            RGPV Connect
          </div>
          <div>{`Semester ${data.semester}${data.session ? ` · ${data.session}` : ''}`}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 24 }}>
            <div style={{ fontSize: 190, fontWeight: 800, letterSpacing: -8, lineHeight: 1 }}>{data.sgpa?.toFixed(2) ?? '—'}</div>
            <div style={{ fontSize: 44, fontWeight: 600, opacity: 0.8 }}>SGPA</div>
          </div>
          {data.cgpa != null ? (
            <div style={{ fontSize: 34, opacity: 0.85 }}>
              {`CGPA ${data.cgpa.toFixed(2)}${change != null ? ` · ${change >= 0 ? 'up' : 'down'} from ${data.previousCgpa!.toFixed(2)}` : ''}`}
            </div>
          ) : null}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.name ? <div style={{ fontSize: 48, fontWeight: 700 }}>{data.name}</div> : null}
            <div style={{ fontSize: 30, opacity: 0.85 }}>{data.line}</div>
            {data.rank ? <div style={{ fontSize: 30, fontWeight: 700 }}>{data.rank}</div> : null}
          </div>
          <div style={{ fontSize: 28, opacity: 0.85 }}>{data.verified ? 'Verified result · rgpvconnect.in' : 'rgpvconnect.in'}</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );

  const download = new URL(request.url).searchParams.get('download') === '1';
  const headers = new Headers(image.headers);
  headers.set('Cache-Control', 'public, max-age=86400, immutable');
  if (download) headers.set('Content-Disposition', `attachment; filename="rgpv-semester-${data.semester}.png"`);
  return new Response(image.body, { status: 200, headers });
}
