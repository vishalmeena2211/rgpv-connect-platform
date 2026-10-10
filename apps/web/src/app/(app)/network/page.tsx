import type { Metadata } from 'next';
import Link from 'next/link';
import { Search, Share2, Users } from 'lucide-react';

import { FeatureClosed } from '@/components/feature-closed';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Card } from '@/components/ui/card';
import { ChipLink } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { type DirectoryScope, getBatchDensity, getDirectory } from '@/features/network/directory-queries';
import { PersonRow } from '@/features/network/person-row';
import { isFeatureOpen } from '@/lib/features';
import { isVerified, requireUser } from '@/lib/session';

export const metadata: Metadata = { title: 'Network' };

const SCOPES: DirectoryScope[] = ['batch', 'college', 'seniors', 'juniors'];

/** Verified students grouped from their enrollment numbers, your batch first. */
export default async function NetworkPage({ searchParams }: { searchParams: Promise<{ scope?: string; q?: string }> }) {
  const user = await requireUser('/network');
  if (!isFeatureOpen('network', user.role)) return <FeatureClosed feature="network" />;
  if (!isVerified(user)) {
    return (
      <Card className="mx-auto max-w-[720px]">
        <EmptyState icon={Users} title="Verify to find your batch" action={<Button asChild><Link href="/onboarding">Verify enrollment</Link></Button>}>
          The network is built on real enrollment numbers, so it opens once yours is verified.
        </EmptyState>
      </Card>
    );
  }
  const { scope: rawScope, q } = await searchParams;
  const scope = SCOPES.includes(rawScope as DirectoryScope) ? (rawScope as DirectoryScope) : 'batch';
  const [{ users, total }, batch] = await Promise.all([getDirectory(user, scope, q?.trim() || undefined), getBatchDensity(user)]);
  const cohort = user.branchCode && user.graduatingBatch ? `${user.branchCode} ${user.graduatingBatch}` : 'my batch';
  const labels: Record<DirectoryScope, string> = { batch: `${cohort} · my batch`, college: `All of ${user.college?.shortName ?? 'my college'}`, seniors: 'Seniors', juniors: 'Juniors' };
  const href = (s: DirectoryScope) => `/network?scope=${s}${q ? `&q=${encodeURIComponent(q)}` : ''}`;

  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-4">
      <PageHeader title="Network" description="Verified students, grouped from their enrollment numbers." />
      <div className="flex flex-wrap items-center gap-2">
        <form action="/network" className="relative w-full sm:w-64">
          <input type="hidden" name="scope" value={scope} />
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
          <Input name="q" defaultValue={q} placeholder="Search by name" className="pl-9" aria-label="Search by name" />
        </form>
        {SCOPES.map((s) => (
          <ChipLink key={s} href={href(s)} on={scope === s}>{labels[s]}</ChipLink>
        ))}
      </div>
      {batch && !batch.reached && batch.size ? (
        <Callout
          tone="brand"
          title={`${batch.verified} of about ${batch.size} in ${cohort} are here`}
          action={<Button asChild size="sm"><Link href="/results/me"><Share2 />Invite my batch</Link></Button>}
        >
          Groups get useful at about a third of the batch. Share your result card in the batch WhatsApp group and they join from there.
        </Callout>
      ) : null}
      {users.length === 0 ? (
        <Card><EmptyState icon={Users} title={q ? `Nobody called “${q}” here` : 'Nobody here yet'}>{q ? 'Check the spelling, or try another scope.' : 'You are one of the first. Invite your batch.'}</EmptyState></Card>
      ) : (
        <>
          <ul className="flex flex-col gap-2">{users.map((u) => <PersonRow key={u.id} user={u} />)}</ul>
          {total > users.length ? <p className="text-xs text-muted-foreground">Showing {users.length} of {total}</p> : null}
        </>
      )}
    </div>
  );
}
