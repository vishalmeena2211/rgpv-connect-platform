import { ImageResponse } from 'next/og';

import { BrandMarkSvg } from '@/components/brand-mark';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/** Home-screen icon on iPhones. Square corners: iOS rounds them itself. */
export default function AppleIcon() {
  return new ImageResponse(<BrandMarkSvg size={180} radius={0} inset={0.08} />, size);
}
