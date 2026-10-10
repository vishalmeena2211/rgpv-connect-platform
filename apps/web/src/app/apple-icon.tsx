import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F8A6F' }}>
        <div style={{ width: 62, height: 62, borderRadius: 17, background: '#FFFFFF' }} />
      </div>
    ),
    size,
  );
}
