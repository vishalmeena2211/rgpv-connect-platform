import type { Metadata } from 'next';
import { AlertTriangle, CheckCircle2, Zap } from 'lucide-react';
import { prisma } from '@rgpv/db';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { DeclareRunner } from '@/features/admin/admin-client';
import { cn, formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Results day' };

export default async function ResultsDayPage() {
  const [batches, running, history] = await Promise.all([
    prisma.user.findMany({ where: { verificationStatus: 'VERIFIED', admissionYear: { not: null } }, distinct: ['admissionYear'], select: { admissionYear: true }, orderBy: { admissionYear: 'desc' } }),
    prisma.resultsDeclaration.findFirst({ where: { status: 'RUNNING' } }),
    prisma.resultsDeclaration.findMany({ orderBy: { startedAt: 'desc' }, take: 8, include: { startedBy: { select: { name: true } } } }),
  ]);

  return (
    <>
      <PageHeader title="Results day" description="When RGPV declares a semester, fetch it for everyone in the batch and tell them." />
      <div className="grid items-start gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Declare a result</CardTitle>
            <span className="text-xs text-muted-foreground">Checked against the portal before sending</span>
          </CardHeader>
          <CardContent>
            <DeclareRunner
              batches={batches.map((b) => b.admissionYear as number)}
              running={running ? { id: running.id, processed: running.processed, total: running.totalStudents, fetched: running.fetched, failed: running.failed } : null}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Earlier runs</CardTitle></CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">No runs yet.</p>
            ) : (
              <ol className="flex flex-col">
                {history.map((run, index) => {
                  const bad = run.status === 'STOPPED' || run.failed > run.fetched;
                  return (
                    <li key={run.id} className="grid grid-cols-[64px_28px_1fr] gap-x-2.5 text-xs">
                      <span className="pt-1.5 text-muted-foreground tabular">{formatDate(run.startedAt).replace(/ \d{4}$/, '')}</span>
                      <span className="flex flex-col items-center">
                        <span className={cn('grid size-[26px] place-items-center rounded-full border', bad ? 'bg-destructive-soft' : 'bg-success-soft')}>
                          {bad ? <AlertTriangle className="size-3 text-destructive" /> : run.status === 'RUNNING' ? <Zap className="size-3 text-warning" /> : <CheckCircle2 className="size-3 text-success-foreground" />}
                        </span>
                        {index < history.length - 1 ? <i className="w-px flex-1 bg-border" /> : null}
                      </span>
                      <span className="pb-3.5 pt-1 leading-[18px]">
                        <b className="block">Semester {run.semester} · batch {run.admissionYear + 4} {run.status === 'RUNNING' ? '(running)' : run.status === 'STOPPED' ? '(stopped)' : ''}</b>
                        <span className="text-muted-foreground">{run.fetched} fetched, {run.failed} failed, {run.notified} notified · by {run.startedBy.name}</span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
