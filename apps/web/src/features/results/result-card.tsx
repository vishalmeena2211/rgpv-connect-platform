import { Fragment } from 'react';
import { Check, TrendingUp } from 'lucide-react';
import { GRADE_POINTS, isGrade, type SemesterResult } from '@rgpv/shared';

import { Badge } from '@/components/ui/badge';
import { StatTile } from '@/components/ui/stat-tile';
import { cn, titleCase } from '@/lib/utils';

import { splitSubject } from './subjects';

const STATUS: Record<SemesterResult['status'], { label: string; variant: 'success' | 'destructive' | 'warning' | 'default' }> = {
  PASS: { label: 'Pass', variant: 'success' },
  FAIL: { label: 'Fail', variant: 'destructive' },
  WITHHELD: { label: 'Withheld', variant: 'warning' },
  UNKNOWN: { label: 'Status unclear', variant: 'default' },
};

export function StatusBadge({ status }: { status: SemesterResult['status'] }) {
  const { label, variant } = STATUS[status];
  return (
    <Badge variant={variant}>
      {status === 'PASS' ? <Check /> : null}
      {label}
    </Badge>
  );
}

function GradePill({ grade }: { grade?: string }) {
  return (
    <span
      className={cn(
        'inline-block min-w-[34px] rounded-[7px] px-1.5 py-[3px] text-center font-display text-xs font-bold tabular',
        grade === 'A+' ? 'bg-success-soft text-success-foreground' : grade === 'F' ? 'bg-destructive-soft text-destructive' : 'bg-muted',
      )}
    >
      {grade ?? '—'}
    </span>
  );
}

/** Subject rows: code + name, credits when the catalogue has them, grade, points. */
export function SubjectTable({
  result,
  credits,
  names,
}: {
  result: SemesterResult;
  credits?: Map<string, number>;
  names?: Map<string, string>;
}) {
  const showCredits = Boolean(credits && credits.size > 0);
  // A subject can print as a theory row and a practical row; its credits go on the first one.
  const credited = new Set<string>();
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full min-w-[420px] text-[13px]">
        <thead className="bg-subtle text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-faint">
          <tr>
            <th className="px-3.5 py-2.5">Subject</th>
            {showCredits ? <th className="px-3.5 py-2.5 text-right">Credits</th> : null}
            <th className="px-3.5 py-2.5 text-right">Grade</th>
            <th className="px-3.5 py-2.5 text-right">Points</th>
          </tr>
        </thead>
        <tbody>
          {result.subjects.map((subject, index) => {
            const { code, part } = splitSubject(subject);
            const credit = code && !credited.has(code) ? credits?.get(code) : undefined;
            if (code && credit !== undefined) credited.add(code);
            const name = code ? names?.get(code) : undefined;
            return (
              <tr key={`${subject.name}-${index}`} className="border-t">
                <td className="px-3.5 py-2.5">
                  <span className="font-semibold">{code ?? subject.name}</span>
                  {part ? <span className="text-faint"> · {part === 'T' ? 'Theory' : 'Practical'}</span> : null}
                  {name ? <span className="text-muted-foreground"> · {name}</span> : null}
                </td>
                {showCredits ? <td className="px-3.5 py-2.5 text-right tabular">{credit ?? '—'}</td> : null}
                <td className="px-3.5 py-2.5 text-right">
                  <GradePill grade={subject.grade} />
                </td>
                <td className="px-3.5 py-2.5 text-right tabular">
                  {subject.grade && isGrade(subject.grade) ? GRADE_POINTS[subject.grade] : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * One semester result: who, status, three headline tiles (SGPA is the dark
 * one), the subject table, and actions. Same component in the public lookup,
 * My results and the phone.
 */
export function ResultCard({
  result,
  previousCgpa,
  credits,
  names,
  actions,
  footer,
}: {
  result: SemesterResult;
  previousCgpa?: number | null;
  credits?: Map<string, number>;
  names?: Map<string, string>;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const totalCredits = credits && credits.size > 0 ? [...credits.values()].reduce((a, b) => a + b, 0) : null;
  const passedAll = result.subjects.every((s) => s.grade !== 'F');
  const change = result.cgpa != null && previousCgpa != null ? Math.round((result.cgpa - previousCgpa) * 100) / 100 : null;

  return (
    <article className="rounded-lg border bg-card shadow-raised">
      <div className="flex flex-col gap-4 p-5 sm:p-[22px]">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="font-display text-[22px] font-bold tracking-[-0.02em]">{titleCase(result.name)}</h2>
              <StatusBadge status={result.status} />
            </div>
            <p className="mt-1 text-[13px] text-muted-foreground tabular">
              {/* Each part stays whole and the dot ends a line, so a wrap never starts with "·". */}
              {[result.enrollment, `Semester ${result.semester}`, result.session, result.branch]
                .filter(Boolean)
                .map((part, index, parts) => (
                  <Fragment key={index}>
                    <span className="whitespace-nowrap">
                      {part}
                      {index < parts.length - 1 ? ' ·' : ''}
                    </span>
                    {index < parts.length - 1 ? ' ' : null}
                  </Fragment>
                ))}
            </p>
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </header>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatTile accent label="SGPA" value={result.sgpa?.toFixed(2) ?? '—'} note={`Semester ${result.semester}`} />
          <StatTile
            label="CGPA"
            value={result.cgpa?.toFixed(2) ?? '—'}
            note={
              change != null ? (
                <span className="inline-flex items-center gap-1">
                  <TrendingUp className="size-3" />
                  {change >= 0 ? 'Up' : 'Down'} {Math.abs(change).toFixed(2)} after {result.semester} semesters
                </span>
              ) : (
                `After ${result.semester} semester${result.semester === 1 ? '' : 's'}`
              )
            }
            noteTone={change != null && change >= 0 ? 'up' : 'muted'}
          />
          <StatTile
            label={totalCredits ? 'Credits' : 'Subjects'}
            value={totalCredits ?? result.subjects.length}
            note={`${result.subjects.length} subjects · ${passedAll ? 'all passed' : 'some to clear'}`}
          />
        </div>

        {result.subjects.length > 0 ? <SubjectTable result={result} credits={credits} names={names} /> : null}

        {result.resultDescription && result.resultDescription !== 'PASS' ? (
          <p className="text-[13px] text-muted-foreground">RGPV note: {result.resultDescription}</p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{footer}</span>
          <span>Grades on RGPV's 10-point scale · A+ 10 · A 9 · B+ 8 · B 7 · C+ 6 · C 5 · D 4</span>
        </div>
      </div>
    </article>
  );
}
