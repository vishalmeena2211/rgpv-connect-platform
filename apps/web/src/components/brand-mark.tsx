/**
 * The RGPV Connect mark, "Eight semesters": eight rising bars on an ink tile,
 * one per semester of a B.Tech, the eighth in marigold wearing a graduation
 * cap. It is plain SVG with fills only (no strokes), so the same element draws
 * in the app and in next/og image routes (Satori) without changes.
 */

export const MARK_INK = '#0F2A24';
export const MARK_GOLD = '#F6C343';

/** x, y and height of each bar in the 48 x 48 box; widths are all 2.6. */
const BARS: [number, number, number, number][] = [
  [6.5, 33, 5, 0.35],
  [10.65, 30.7, 7.3, 0.43],
  [14.8, 28.4, 9.6, 0.51],
  [18.95, 26.1, 11.9, 0.59],
  [23.1, 23.8, 14.2, 0.67],
  [27.25, 21.5, 16.5, 0.75],
  [31.4, 19.2, 18.8, 0.85],
];

export function BrandMarkSvg({
  size,
  radius = 12,
  inset = 0,
  label,
}: {
  /** Rendered width and height in px. */
  size: number;
  /** Corner radius of the tile in the 48-unit box; 0 for icons the OS masks itself. */
  radius?: number;
  /** Shrinks the artwork toward the centre (0 to 0.3), for maskable app icons. */
  inset?: number;
  /** Accessible name; without it the mark is decorative. */
  label?: string;
}) {
  const scale = 1 - inset;
  const shift = 24 * inset;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <rect width="48" height="48" rx={radius} fill={MARK_INK} />
      {/* Satori writes an undefined attribute out literally and drops the group, so omit it entirely. */}
      <g {...(inset ? { transform: `translate(${shift} ${shift}) scale(${scale})` } : {})}>
        {BARS.map(([x, y, h, opacity]) => (
          <rect key={x} x={x} y={y} width="2.6" height={h} rx="1.3" fill="#FFFFFF" opacity={opacity} />
        ))}
        <rect x="35.55" y="16.9" width="2.6" height="21.1" rx="1.3" fill={MARK_GOLD} />
        <path d="M36.85 8.6 L41.6 11.2 L36.85 13.8 L32.1 11.2 Z" fill={MARK_GOLD} />
        <rect x="41.1" y="11.2" width="1" height="4.2" rx="0.5" fill={MARK_GOLD} />
      </g>
    </svg>
  );
}
