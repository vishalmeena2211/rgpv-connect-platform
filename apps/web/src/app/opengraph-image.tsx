import { ImageResponse } from 'next/og';

import { BrandMarkSvg } from '@/components/brand-mark';

export const alt = 'RGPV Connect: your RGPV result in ten seconds, then your whole batch';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** The card shown when any page without its own image is shared on WhatsApp, X or LinkedIn. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          color: '#FFFFFF',
          background: 'linear-gradient(135deg, #0F2A24 0%, #16453A 55%, #0F8A6F 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', borderRadius: 18, border: '2px solid rgba(255,255,255,0.25)' }}>
            <BrandMarkSvg size={64} />
          </div>
          <div style={{ fontSize: 34, fontWeight: 700 }}>RGPV Connect</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>Your RGPV result,</div>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, color: '#9FE3CF' }}>in ten seconds.</div>
          <div style={{ fontSize: 30, opacity: 0.85, marginTop: 8 }}>Every semester · CGPA trend · Notes and papers · Your verified batch</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 26, opacity: 0.8 }}>
          <span>Free and open source</span>
          <span>rgpvconnect.co.in</span>
        </div>
      </div>
    ),
    size,
  );
}
