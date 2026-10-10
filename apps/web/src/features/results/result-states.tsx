import Link from 'next/link';
import { Bell, ChevronLeft, Clock, RefreshCw } from 'lucide-react';
import { parseEnrollment, semesterSchedule } from '@rgpv/shared';

import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate } from '@/lib/utils';

import type { LastKnown } from './service';

/** RGPV has no result for this semester: say why it is probably not out yet. */
export function NotDeclared({
  enrollment,
  semester,
  latestHref,
  latestSemester,
  notifyHref,
}: {
  enrollment: string;
  semester: number;
  latestHref: string | null;
  latestSemester: number | null;
  notifyHref: string;
}) {
  const parsed = parseEnrollment(enrollment);
  const schedule = parsed ? semesterSchedule(semester, parsed.admissionYear) : null;
  const previous = parsed && semester > 1 ? semesterSchedule(semester - 1, parsed.admissionYear) : null;
  const next = parsed && semester < 8 ? semesterSchedule(semester + 1, parsed.admissionYear) : null;

  return (
    <div className="flex flex-col gap-4">
      <Card className="shadow-raised">
        <CardContent className="flex flex-col gap-2 py-7">
          <EmptyState
            icon={Clock}
            title={
              parsed
                ? `Semester ${semester} is not declared yet for the ${parsed.admissionYear} batch`
                : `No semester ${semester} result yet`
            }
            action={
              <>
                {latestHref && latestSemester ? (
                  <Button asChild>
                    <Link href={latestHref}>
                      <ChevronLeft />
                      Show semester {latestSemester} instead
                    </Link>
                  </Button>
                ) : null}
                <Button asChild variant="outline">
                  <Link href={notifyHref}>
                    <Bell />
                    Tell me when it’s out
                  </Link>
                </Button>
              </>
            }
          >
            RGPV holds no semester {semester} result for {enrollment}.
            {schedule ? ` Exams for this semester are in ${schedule.examWindow}, so the result usually appears in ${schedule.declareWindow}.` : ''}
          </EmptyState>
        </CardContent>
      </Card>
      {schedule ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {previous ? (
            <ScheduleStep label="Before" title={`Semester ${semester - 1} · ${previous.declareWindow}`} body="Declared after the exams in the previous term." />
          ) : null}
          <ScheduleStep label="Expected" title={`Semester ${semester} · ${schedule.declareWindow}`} body={`${schedule.isOdd ? 'Odd' : 'Even'} semesters are declared after the ${schedule.examWindow.replace(/ \d{4}$/, '')} exams.`} />
          {next ? <ScheduleStep label="Then" title={`Semester ${semester + 1} · ${next.declareWindow}`} body="The usual window; RGPV sometimes runs late." /> : null}
        </div>
      ) : null}
    </div>
  );
}

function ScheduleStep({ label, title, body }: { label: string; title: string; body: string }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border bg-card p-4 shadow-card">
      <span className="font-display text-[11px] font-bold tracking-[0.1em] text-accent-foreground">{label.toUpperCase()}</span>
      <span className="font-display text-sm font-bold">{title}</span>
      <span className="text-[12.5px] leading-[18px] text-muted-foreground">{body}</span>
    </div>
  );
}

/** The portal did not answer after the worker's retries. Never show worker error text. */
export function PortalDown({
  enrollment,
  retryHref,
  lastKnown,
  lastKnownHref,
}: {
  enrollment: string;
  retryHref: string;
  lastKnown: LastKnown | null;
  lastKnownHref: string | null;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Callout
        tone="warning"
        title="RGPV’s result portal is not answering right now"
        action={
          <Button asChild>
            <Link href={retryHref}>
              <RefreshCw />
              Try again now
            </Link>
          </Button>
        }
      >
        We tried three times over 45 seconds. This happens on results day when everyone loads it at once. Your number is
        correct; the portal is the problem.
      </Callout>
      {lastKnown ? (
        <Card>
          <CardHeader>
            <CardTitle>Last known result for {enrollment}</CardTitle>
            <span className="text-xs text-muted-foreground">Fetched {formatDate(lastKnown.fetchedAt)}</span>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-baseline gap-5 tabular">
              <span className="font-display text-sm font-bold">Semester {lastKnown.semester}</span>
              <span>
                <span className="font-display text-lg font-bold">{lastKnown.sgpa?.toFixed(2) ?? '—'}</span>{' '}
                <span className="text-xs text-faint">SGPA</span>
              </span>
              <span>
                <span className="font-display text-lg font-bold">{lastKnown.cgpa?.toFixed(2) ?? '—'}</span>{' '}
                <span className="text-xs text-faint">CGPA</span>
              </span>
            </div>
            {lastKnownHref ? (
              <Button asChild variant="outline" size="sm">
                <Link href={lastKnownHref}>Open</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

/** Too many uncached lookups from this connection. Cached results still open. */
export function RateLimited({ retryAfterSeconds }: { retryAfterSeconds: number }) {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return (
    <Callout tone="warning" title="Too many new lookups from this connection">
      Every new lookup costs a captcha solve, so each connection gets a few dozen an hour. Try again in about {minutes}{' '}
      minute{minutes === 1 ? '' : 's'}. Results someone already checked in the last six hours still open straight away.
    </Callout>
  );
}

export function InvalidEnrollment({ value }: { value: string }) {
  return (
    <Callout tone="danger" title={`“${value}” is not an RGPV enrollment number`}>
      Enrollment numbers look like 0151CS241042: a 4-digit college code, a 2-letter branch, the admission year and a
      serial. Check the number on your admit card.
    </Callout>
  );
}
