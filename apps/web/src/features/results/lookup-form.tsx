'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { Building2, CheckCircle2, GraduationCap, Loader2, Search } from 'lucide-react';
import { COURSE_SEMESTERS, isValidEnrollment, latestDeclaredSemester, parseEnrollment } from '@rgpv/shared';
import { track } from '@/lib/analytics';

import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { lookupHref } from './links';

const RECENT_KEY = 'rgpv:recent-lookups';

export interface RecentLookup {
  enrollment: string;
  semester: number;
}

function readRecent(): RecentLookup[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as RecentLookup[]).slice(0, 5) : [];
  } catch {
    return [];
  }
}

function remember(entry: RecentLookup) {
  try {
    const next = [entry, ...readRecent().filter((r) => !(r.enrollment === entry.enrollment && r.semester === entry.semester))];
    localStorage.setItem(RECENT_KEY, JSON.stringify(next.slice(0, 5)));
  } catch {
    // Private mode or blocked storage: recent lookups are a convenience only.
  }
}

/**
 * Enrollment + semester form. College, branch and batch are decoded live from
 * the number before any network call, and the semester defaults to the latest
 * one that is likely declared for that batch.
 */
export function LookupForm({
  mode,
  initialEnrollment = '',
  initialSemester,
  compact = false,
  autoFocus = false,
  collegeNames = {},
}: {
  mode: 'public' | 'app';
  initialEnrollment?: string;
  initialSemester?: number;
  compact?: boolean;
  autoFocus?: boolean;
  /** College code → short name, for the decoded chip. */
  collegeNames?: Record<string, string>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(initialEnrollment);
  const [semester, setSemester] = useState<number | 'auto'>(initialSemester ?? 'auto');
  const [touched, setTouched] = useState(false);

  const parsed = useMemo(() => parseEnrollment(value), [value]);
  const latest = parsed ? latestDeclaredSemester(parsed.admissionYear) : null;
  const effective = semester === 'auto' ? (latest ?? 1) : semester;
  const invalid = touched && value.length > 0 && !isValidEnrollment(value);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (!parsed) return;
    remember({ enrollment: parsed.raw, semester: effective });
    track('Result looked up', { semester: effective, from: mode === 'public' ? 'home' : 'lookup page' });
    startTransition(() => router.push(lookupHref(mode, parsed.raw, effective)));
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3.5" noValidate>
      <div className={cn('grid gap-2.5', compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-[1fr_170px]')}>
        <Field
          label="Enrollment number"
          htmlFor="lookup-enrollment"
          error={invalid ? 'That is not an RGPV enrollment number. It looks like 0151CS241042.' : undefined}
        >
          <div className="relative">
            <GraduationCap className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <Input
              id="lookup-enrollment"
              value={value}
              onChange={(e) => setValue(e.target.value.toUpperCase())}
              onBlur={() => setTouched(true)}
              placeholder="0151CS241042"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              autoFocus={autoFocus}
              aria-invalid={invalid}
              className="h-12 pl-9 text-[15px] font-medium tabular"
            />
          </div>
        </Field>
        <Field label="Semester" htmlFor="lookup-semester">
          <Select
            id="lookup-semester"
            value={String(semester)}
            onChange={(e) => setSemester(e.target.value === 'auto' ? 'auto' : Number(e.target.value))}
            className="h-12 text-[15px]"
          >
            <option value="auto">{latest ? `Latest · semester ${latest}` : 'Latest'}</option>
            {Array.from({ length: COURSE_SEMESTERS }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                Semester {n}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {parsed ? (
        <div className="flex flex-wrap gap-1.5 animate-fade-up" aria-live="polite">
          <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-accent-strong bg-accent px-2.5 text-xs font-medium text-accent-foreground">
            <Building2 className="size-3" />
            {collegeNames[parsed.collegeCode] ?? `College ${parsed.collegeCode}`}
          </span>
          <span className="inline-flex h-7 items-center rounded-full border border-accent-strong bg-accent px-2.5 text-xs font-medium text-accent-foreground">
            {parsed.branchName}
          </span>
          <span className="inline-flex h-7 items-center rounded-full border border-accent-strong bg-accent px-2.5 text-xs font-medium text-accent-foreground">
            Admitted {parsed.admissionYear} · batch {parsed.graduatingBatch}
          </span>
        </div>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Search />}
        {pending ? 'Asking RGPV’s portal…' : 'Check result'}
      </Button>
      {!compact ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle2 className="size-3.5 text-success" />
          No sign-up. About 10 seconds, because we ask RGPV’s portal live.
        </p>
      ) : null}
    </form>
  );
}

/** Last five lookups on this device, for one-tap repeats on results day. */
export function RecentLookups({ mode }: { mode: 'public' | 'app' }) {
  const [recent, setRecent] = useState<RecentLookup[]>([]);
  useEffect(() => setRecent(readRecent()), []);
  if (recent.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">Recent on this device</p>
      {recent.map((r) => (
        <button
          key={`${r.enrollment}-${r.semester}`}
          type="button"
          onClick={() => (window.location.href = lookupHref(mode, r.enrollment, r.semester))}
          className="flex items-center justify-between rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-muted"
        >
          <span className="tabular">
            {r.enrollment} · semester {r.semester}
          </span>
          <span className="font-semibold text-accent-foreground">Open</span>
        </button>
      ))}
    </div>
  );
}
