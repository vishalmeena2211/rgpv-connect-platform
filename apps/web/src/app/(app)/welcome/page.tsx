import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Building2, Download, Share2, UsersRound } from 'lucide-react';
import { prisma } from '@rgpv/db';

import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { InstallButton } from '@/features/pwa/install-button';
import { getSavedResults, syncPlan } from '@/features/results/queries';
import { SyncPanel } from '@/features/results/sync-panel';
import { requireUser } from '@/lib/session';

export const metadata: Metadata = { title: 'Welcome' };

function Step({ n, title, body, action }: { n: number; title: string; body: string; action: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-3 rounded-md border bg-card p-4 shadow-card sm:grid-cols-[auto_1fr_auto]">
      <span className="grid size-8 place-items-center rounded-full bg-accent font-display text-xs font-bold text-accent-foreground">{n}</span>
      <div>
        <p className="font-display text-[13px] font-bold">{title}</p>
        <p className="text-xs leading-[17px] text-muted-foreground">{body}</p>
      </div>
      <div className="col-span-2 sm:col-span-1">{action}</div>
    </div>
  );
}

/** First signed-in screen after verifying: what just unlocked, and three next steps. */
export default async function WelcomePage() {
  const user = await requireUser('/welcome');
  if (user.verificationStatus !== 'VERIFIED') redirect('/onboarding');

  const [saved, groups] = await Promise.all([
    getSavedResults(user.id),
    prisma.group.findMany({
      where: { members: { some: { userId: user.id } } },
      select: { id: true, name: true, type: true, branchCode: true, graduatingBatch: true, collegeId: true, _count: { select: { members: true } } },
    }),
  ]);
  const plan = syncPlan(user.admissionYear, saved);
  const latest = saved.at(-1);
  const sizes = await prisma.cohortSize.findMany({ where: { collegeCode: user.college?.code ?? '' } });

  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-5">
      <Callout tone="success" title={`Verified. Welcome, ${user.name.split(' ')[0]}.`}>
        {latest ? `Your semester ${latest.semester} result is saved. ` : ''}You are in{' '}
        {groups.map((g) => g.name).join(' and ') || 'your college groups'}.
      </Callout>
      <PageHeader title="You’re set up" description="Three things worth doing in the next minute." />
      <div className="flex flex-col gap-2.5">
        <Step
          n={1}
          title={plan.pending.length ? `Fetch your other ${plan.pending.length === 1 ? 'semester' : 'semesters'}` : 'All your semesters are saved'}
          body={plan.pending.length ? `Semesters ${plan.pending.join(', ')} from RGPV, about ${plan.pending.length * 10} seconds. Then your CGPA trend appears.` : 'Your CGPA trend is ready in My results.'}
          action={plan.pending.length ? <SyncPanel pending={plan.pending} label={`Fetch ${plan.pending.length}`} variant="default" /> : (
            <Button asChild size="sm" variant="outline"><Link href="/results/me">Open</Link></Button>
          )}
        />
        <Step
          n={2}
          title={latest ? `Share your semester ${latest.semester} card` : 'Share your card'}
          body={latest?.sgpa != null ? `SGPA ${latest.sgpa.toFixed(2)} on a verified card with your name. Drop it in your batch group.` : 'A verified card with your name for your batch group.'}
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/results/me"><Share2 />Share card</Link>
            </Button>
          }
        />
        <Step
          n={3}
          title="Add RGPV Connect to your home screen"
          body="Results open offline and you hear the moment a semester is declared."
          action={<InstallButton size="sm" variant="outline" icon={<Download />} />}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your groups</CardTitle>
          <span className="text-xs text-muted-foreground">Joined automatically from your enrollment number</span>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {groups.map((group) => {
            const size = group.branchCode && group.graduatingBatch ? sizes.find((s) => s.branchCode === group.branchCode && s.graduatingBatch === group.graduatingBatch)?.size : null;
            return (
              <span key={group.id} className="inline-flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-xs">
                {group.type === 'COLLEGE' ? <Building2 className="size-3.5 text-primary" /> : <UsersRound className="size-3.5 text-primary" />}
                <span>
                  <b className="block font-display text-[13px]">{group.name}</b>
                  <span className="text-muted-foreground">
                    {group._count.members} verified{size ? ` of about ${size}` : ''}
                  </span>
                </span>
              </span>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
