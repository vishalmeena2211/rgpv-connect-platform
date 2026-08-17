import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge conditional class names and de-duplicate Tailwind utilities. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/** Format an integer paise amount as Indian rupees (e.g. 150000 → "₹1,500"). */
export function formatPrice(paise: number): string {
  return INR.format(Math.round(paise / 100));
}

/** Up-to-two-letter initials from a name, for avatar fallbacks. */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['week', 604_800],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
];

/** Compact "3h ago" style relative timestamp from an ISO date string. */
export function relativeTime(iso: string): string {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto', style: 'narrow' });
  for (const [unit, secondsPerUnit] of RELATIVE_UNITS) {
    if (seconds >= secondsPerUnit) {
      return formatter.format(-Math.floor(seconds / secondsPerUnit), unit);
    }
  }
  return 'just now';
}

/**
 * Decode the branch + graduating batch into a short "CSE '25" style tag for
 * profile chips. Returns null when grouping data is unavailable.
 */
export function batchTag(branchCode: string | null, graduatingBatch: number | null): string | null {
  if (!branchCode && !graduatingBatch) return null;
  const year = graduatingBatch ? ` '${String(graduatingBatch).slice(-2)}` : '';
  return `${branchCode ?? ''}${year}`.trim();
}
