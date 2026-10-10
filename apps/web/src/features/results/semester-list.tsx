import { Bell, ChevronDown, Clock } from 'lucide-react';
import { semesterSchedule } from '@rgpv/shared';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import type { SavedResult } from './queries';
import { StatusBadge, SubjectTable } from './result-card';

/** One row per saved semester, newest first; each opens its subject table in place. */
export function SemesterList({
  results,
  admissionYear,
  nextSemester,
  credits,
}: {
  results: SavedResult[];
  admissionYear: number | null;
  /** The semester being studied, shown as "not declared" when its result is not saved. */
  nextSemester: number | null;
  credits: Map<number, Map<string, number>>;
}) {
  const upcoming = nextSemester && admissionYear && !results.some((r) => r.semester === nextSemester)
    ? semesterSchedule(nextSemester, admissionYear)
    : null;

  return (
    <div className="flex flex-col gap-2">
      {upcoming ? (
        <div className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-md border bg-subtle px-4 py-3 sm:grid-cols-[110px_1fr_auto_auto]">
          <b className="font-display text-[13px]">Semester {upcoming.semester}</b>
          <span className="hidden text-xs text-muted-foreground sm:block">
            Exams {upcoming.examWindow} · result expected {upcoming.declareWindow}
          </span>
          <Badge>
            <Clock />
            Not declared
          </Badge>
          <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex">
            <a href="/settings#notifications">
              <Bell />
              Tell me
            </a>
          </Button>
        </div>
      ) : null}
      {[...results].reverse().map((record) => (
        <details key={record.semester} className="group rounded-md border bg-card shadow-card">
          <summary className="grid cursor-pointer list-none grid-cols-[1fr_auto_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[110px_1fr_auto_auto_auto_16px] [&::-webkit-details-marker]:hidden">
            <b className="font-display text-[13px]">Semester {record.semester}</b>
            <span className="hidden text-xs text-muted-foreground sm:block">
              {record.payload?.session ?? ''}
              {record.payload ? ` · ${record.payload.subjects.length} subjects` : ''}
            </span>
            <span className="hidden sm:block">
              <StatusBadge status={record.status} />
            </span>
            <Figure value={record.sgpa} label="SGPA" />
            <Figure value={record.cgpa} label="CGPA" />
            <ChevronDown className="hidden size-4 text-faint transition-transform group-open:rotate-180 sm:block" />
          </summary>
          {record.payload ? (
            <div className="border-t px-4 py-3">
              <SubjectTable result={record.payload} credits={credits.get(record.semester)} />
            </div>
          ) : null}
        </details>
      ))}
    </div>
  );
}

function Figure({ value, label }: { value: number | null; label: string }) {
  return (
    <span className="min-w-[52px] text-right font-display text-[17px] font-bold tracking-[-0.02em] tabular">
      {value?.toFixed(2) ?? '—'}
      <small className="block font-sans text-[10px] font-semibold tracking-[0.06em] text-faint">{label}</small>
    </span>
  );
}
