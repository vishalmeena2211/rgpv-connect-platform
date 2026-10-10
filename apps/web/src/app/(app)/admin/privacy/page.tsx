import type { Metadata } from 'next';
import { ShieldCheck, Trash2 } from 'lucide-react';
import { prisma } from '@rgpv/db';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { CompleteDeletionButton, DisputeDecision } from '@/features/admin/admin-client';
import { formatDate, maskEnrollment } from '@/lib/utils';

export const metadata: Metadata = { title: 'Privacy and claims' };

export default async function PrivacyAdminPage() {
  const [deletions, disputes] = await Promise.all([
    prisma.deletionRequest.findMany({ where: { status: 'PENDING' }, orderBy: { eligibleAt: 'asc' } }),
    prisma.identityDispute.findMany({
      where: { status: 'OPEN' },
      orderBy: { createdAt: 'asc' },
      include: {
        claimant: { select: { name: true, email: true, createdAt: true } },
        holder: { select: { name: true, email: true, verifiedAt: true, accounts: { select: { provider: true } } } },
      },
    }),
  ]);
  const now = new Date();

  return (
    <>
      <PageHeader title="Privacy and claims" description="Deletion requests (seven-day wait) and claims that someone else verified a student’s number." />
      <Card>
        <CardHeader>
          <CardTitle>Deletion requests</CardTitle>
          <Badge variant={deletions.length ? 'warning' : 'default'}>{deletions.length} open</Badge>
        </CardHeader>
        {deletions.length === 0 ? (
          <EmptyState icon={Trash2} title="No deletion requests" />
        ) : (
          <CardContent className="flex flex-col gap-3">
            {deletions.map((d) => {
              const eligible = d.eligibleAt <= now;
              return (
                <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
                  <div>
                    <p className="text-[13px] font-semibold">{d.userLabel}</p>
                    <p className="text-xs text-muted-foreground">
                      Asked {formatDate(d.requestedAt)}{d.reason ? `: “${d.reason}”` : ''} · {eligible ? 'seven-day wait is over' : `wait ends ${formatDate(d.eligibleAt)}`}
                    </p>
                  </div>
                  <CompleteDeletionButton id={d.id} label={d.userLabel} eligible={eligible} />
                </div>
              );
            })}
          </CardContent>
        )}
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Identity claims</CardTitle>
          <Badge variant={disputes.length ? 'warning' : 'default'}>{disputes.length} open</Badge>
        </CardHeader>
        {disputes.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="No open claims" />
        ) : (
          <CardContent className="flex flex-col gap-3">
            {disputes.map((d) => (
              <div key={d.id} className="flex flex-col gap-3 rounded-md border p-3">
                <div className="grid gap-3 text-[13px] sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">Holds {maskEnrollment(d.enrollmentNumber)}</p>
                    <p className="font-semibold">{d.holder.name}</p>
                    <p className="text-xs text-muted-foreground">{d.holder.email} · verified {d.holder.verifiedAt ? formatDate(d.holder.verifiedAt) : '—'} · {d.holder.accounts.some((a) => a.provider === 'google') ? 'Google' : 'email link'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">Claims it</p>
                    <p className="font-semibold">{d.claimant.name}</p>
                    <p className="text-xs text-muted-foreground">{d.claimant.email} · joined {formatDate(d.claimant.createdAt)}</p>
                  </div>
                </div>
                {d.note ? <p className="rounded-md bg-subtle p-2.5 text-[13px]">“{d.note}”</p> : null}
                <p className="text-xs text-muted-foreground">Check with the student (ID card or an email from their college) before releasing. Releasing unverifies the holder and deletes their saved results.</p>
                <DisputeDecision id={d.id} holder={d.holder.name.split(' ')[0]!} claimant={d.claimant.name.split(' ')[0]!} />
              </div>
            ))}
          </CardContent>
        )}
      </Card>
    </>
  );
}
