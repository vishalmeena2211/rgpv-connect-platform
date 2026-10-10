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

const COUNT = new Intl.NumberFormat('en-IN');

/** Indian digit grouping for counts: 1284 → "1,284". */
export function formatCount(value: number): string {
  return COUNT.format(value);
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

const TZ = 'Asia/Kolkata';

/** "3 Oct 2026" in India time. */
export function formatDate(iso: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ }).format(
    new Date(iso),
  );
}

/** "Today, 4:12 pm" / "Yesterday, 7:22 pm" / "3 Oct, 11:20 am" in India time. */
export function formatWhen(iso: string | Date): string {
  const date = new Date(iso);
  const time = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TZ })
    .format(date)
    .replace(/\s?([AP])M/i, (_, p: string) => ` ${p.toLowerCase()}m`);
  const day = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d);
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86_400_000);
  if (day(date) === day(today)) return `Today, ${time}`;
  if (day(date) === day(yesterday)) return `Yesterday, ${time}`;
  const short = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: TZ }).format(date);
  return `${short}, ${time}`;
}

/** "3.1 MB" from bytes. */
export function formatBytes(bytes: number | null | undefined): string | null {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Keep the college/branch/year prefix and hide the serial: 0151CS24••••. */
export function maskEnrollment(enrollment: string): string {
  return enrollment.slice(0, 8) + '•'.repeat(Math.max(0, enrollment.length - 8));
}

/** "1 subject" / "6 subjects". */
export function plural(count: number, one: string, many = `${one}s`): string {
  return `${formatCount(count)} ${count === 1 ? one : many}`;
}

/**
 * "CS 2028" style cohort tag from the branch and graduating batch. Returns
 * null when grouping data is unavailable.
 */
export function batchTag(branchCode: string | null, graduatingBatch: number | null): string | null {
  if (!branchCode && !graduatingBatch) return null;
  return [branchCode, graduatingBatch].filter(Boolean).join(' ');
}
