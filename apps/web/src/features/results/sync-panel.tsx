'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { CheckCircle2, Clock, Loader2, RefreshCw, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import { type SyncOutcome, syncSemester } from './actions';

type Line = { semester: number; state: 'waiting' | 'running' } | SyncOutcome;

/** Two at a time: fast enough on a phone, gentle on RGPV's portal. */
const CONCURRENCY = 2;

/**
 * Fetches each pending semester with its own server call, so progress shows
 * line by line and a failure in one semester never loses the others.
 */
export function SyncPanel({
  pending,
  label = 'Check for new results',
  variant = 'secondary',
}: {
  pending: number[];
  label?: string;
  variant?: 'default' | 'secondary';
}) {
  const router = useRouter();
  const [lines, setLines] = useState<Line[] | null>(null);
  const [running, setRunning] = useState(false);
  const [, startTransition] = useTransition();

  async function run(semesters: number[]) {
    if (semesters.length === 0) return;
    setRunning(true);
    setLines((current) => {
      const kept = (current ?? []).filter((line) => !semesters.includes(line.semester));
      return [...kept, ...semesters.map((semester) => ({ semester, state: 'waiting' as const }))].sort((a, b) => b.semester - a.semester);
    });

    const queue = [...semesters].sort((a, b) => b - a);
    const worker = async () => {
      for (let next = queue.shift(); next !== undefined; next = queue.shift()) {
        const semester = next;
        setLines((current) => current?.map((line) => (line.semester === semester ? { semester, state: 'running' } : line)) ?? null);
        let outcome: SyncOutcome;
        try {
          outcome = await syncSemester(semester);
        } catch {
          outcome = { semester, kind: 'failed', message: 'Something went wrong.' };
        }
        setLines((current) => current?.map((line) => (line.semester === semester ? outcome : line)) ?? null);
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, semesters.length) }, worker));
    setRunning(false);
    startTransition(() => router.refresh());
  }

  const done = lines?.filter((line) => 'kind' in line).length ?? 0;
  const total = lines?.length ?? 0;
  const failed = lines?.filter((line): line is Extract<SyncOutcome, { kind: 'failed' }> => 'kind' in line && line.kind === 'failed') ?? [];

  return (
    <div className="flex flex-col gap-3">
      <Button variant={variant} disabled={running || pending.length === 0} onClick={() => run(pending)} title={pending.length === 0 ? 'Every declared semester is saved' : undefined}>
        {running ? <Loader2 className="animate-spin" /> : <RefreshCw />}
        {running ? 'Checking…' : label}
      </Button>
      {lines ? (
        <Card className="animate-fade-up">
          <CardHeader>
            <CardTitle>{running ? 'Fetching from RGPV’s portal' : 'Fetch finished'}</CardTitle>
            <span className="text-xs text-muted-foreground tabular">
              {done} of {total} done
            </span>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Progress value={total ? (done / total) * 100 : 0} />
            <ul className="flex flex-col gap-2 text-[13px]">
              {lines.map((line) => (
                <li key={line.semester} className="flex items-start gap-2">
                  {'kind' in line ? (
                    line.kind === 'saved' ? (
                      <>
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                        <span>
                          <b>Semester {line.semester}</b> · SGPA {line.sgpa?.toFixed(2) ?? '—'} · saved
                        </span>
                      </>
                    ) : line.kind === 'not_declared' ? (
                      <>
                        <Clock className="mt-0.5 size-4 shrink-0 text-faint" />
                        <span>
                          <b>Semester {line.semester}</b> · not declared yet
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                        <span>
                          <b>Semester {line.semester}</b> · {line.message}
                        </span>
                      </>
                    )
                  ) : (
                    <>
                      {line.state === 'running' ? (
                        <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-warning" />
                      ) : (
                        <Clock className="mt-0.5 size-4 shrink-0 text-faint" />
                      )}
                      <span>
                        <b>Semester {line.semester}</b> · {line.state === 'running' ? 'asking the portal' : 'waiting'}
                      </span>
                    </>
                  )}
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              Each semester is a separate fetch and takes 5 to 15 seconds. What is saved stays saved.
            </p>
          </CardContent>
        </Card>
      ) : null}
      {!running && failed.length > 0 ? (
        <Callout
          tone="warning"
          title={`${failed.length === 1 ? `Semester ${failed[0]!.semester}` : `${failed.length} semesters`} could not be fetched this time`}
          action={
            <Button size="sm" variant="outline" onClick={() => run(failed.map((line) => line.semester))}>
              Try again
            </Button>
          }
        >
          {failed[0]!.message} Everything else is saved; nothing else is affected.
        </Callout>
      ) : null}
    </div>
  );
}
