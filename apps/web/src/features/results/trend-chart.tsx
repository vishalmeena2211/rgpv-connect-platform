import { COURSE_SEMESTERS } from '@rgpv/shared';

/**
 * SGPA (solid, filled) and CGPA (dashed) by semester on one 6–10 scale, with
 * room for the semesters still to come. Pure SVG, coloured from theme tokens.
 */
type Point = { semester: number; sgpa: number | null; cgpa: number | null };

export function TrendChart({ points }: { points: Point[] }) {
  // Two drawings of one scale: a wide one for desktop and a narrow one whose
  // labels stay readable on a phone, instead of one SVG shrunk to fit.
  return (
    <>
      <div className="hidden sm:block">
        <TrendSvg points={points} w={640} h={160} font={10} />
      </div>
      <div className="sm:hidden">
        <TrendSvg points={points} w={340} h={170} font={11} short />
      </div>
    </>
  );
}

function TrendSvg({ points, w, h, font, short = false }: { points: Point[]; w: number; h: number; font: number; short?: boolean }) {
  const values = points.flatMap((p) => [p.sgpa, p.cgpa]).filter((v): v is number => v != null);
  const floor = Math.min(6, Math.floor(Math.min(...values, 6)));
  const left = short ? 26 : 36;
  const right = short ? 12 : 16;
  const top = 18;
  const bottom = 26;
  const x = (semester: number) => left + (semester - 1) * ((w - left - right) / (COURSE_SEMESTERS - 1));
  const y = (value: number) => top + (10 - value) * ((h - top - bottom) / (10 - floor));

  const sgpa = points.filter((p) => p.sgpa != null).map((p) => [x(p.semester), y(p.sgpa as number)] as const);
  const cgpa = points.filter((p) => p.cgpa != null).map((p) => [x(p.semester), y(p.cgpa as number)] as const);
  const path = (pts: readonly (readonly [number, number])[]) =>
    pts.map(([a, b], i) => `${i ? 'L' : 'M'}${a.toFixed(1)} ${b.toFixed(1)}`).join(' ');
  const last = points.filter((p) => p.sgpa != null).at(-1);
  const ticks = floor <= 6 ? [floor, 8, 10] : [floor, 10];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="block h-auto w-full" role="img" aria-label="SGPA and CGPA by semester">
      {ticks.map((tick) => (
        <g key={tick}>
          <line x1={left} x2={w - right} y1={y(tick)} y2={y(tick)} stroke="rgb(var(--border))" />
          <text x={left - 8} y={y(tick) + 4} fontSize={font} textAnchor="end" fill="rgb(var(--faint-foreground))">
            {tick}
          </text>
        </g>
      ))}
      {Array.from({ length: COURSE_SEMESTERS }, (_, i) => i + 1).map((semester) => (
        <text
          key={semester}
          x={x(semester)}
          y={h - 6}
          fontSize={font}
          textAnchor="middle"
          fill={points.some((p) => p.semester === semester) ? 'rgb(var(--muted-foreground))' : 'rgb(var(--border))'}
        >
          {short ? `S${semester}` : `Sem ${semester}`}
        </text>
      ))}
      {sgpa.length > 1 ? (
        <path
          d={`${path(sgpa)} L${sgpa.at(-1)![0]} ${y(floor)} L${sgpa[0]![0]} ${y(floor)} Z`}
          fill="rgb(var(--primary) / 0.1)"
        />
      ) : null}
      {cgpa.length > 1 ? (
        <path d={path(cgpa)} fill="none" stroke="rgb(var(--faint-foreground))" strokeWidth="1.5" strokeDasharray="4 3" />
      ) : null}
      {sgpa.length > 1 ? <path d={path(sgpa)} fill="none" stroke="rgb(var(--primary))" strokeWidth="2.5" /> : null}
      {sgpa.map(([a, b], i) => (
        <circle
          key={i}
          cx={a}
          cy={b}
          r={i === sgpa.length - 1 ? 5 : 3.5}
          fill="rgb(var(--card))"
          stroke="rgb(var(--primary))"
          strokeWidth="2"
        />
      ))}
      {last?.sgpa != null ? (
        <text
          x={x(last.semester)}
          y={y(last.sgpa) - 11}
          fontSize={font + 1}
          fontWeight="600"
          textAnchor="middle"
          fill="rgb(var(--foreground))"
        >
          {last.sgpa.toFixed(2)}
        </text>
      ) : null}
    </svg>
  );
}

/** Small filled sparkline for the landing page. */
export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const w = 300;
  const h = 44;
  const min = Math.min(...values) - 0.3;
  const max = Math.max(...values) + 0.3;
  const x = (i: number) => 6 + i * ((w - 12) / (values.length - 1));
  const y = (v: number) => 6 + (max - v) * ((h - 12) / (max - min));
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={className} aria-hidden>
      <path d={`${d} L${x(values.length - 1)} ${h} L${x(0)} ${h} Z`} fill="rgb(var(--success-soft))" />
      <path d={d} fill="none" stroke="rgb(var(--success))" strokeWidth="2" />
      <circle cx={x(values.length - 1)} cy={y(values.at(-1)!)} r="3.5" fill="rgb(var(--card))" stroke="rgb(var(--success))" strokeWidth="2" />
    </svg>
  );
}
