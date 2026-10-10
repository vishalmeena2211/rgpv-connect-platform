import type { Metadata } from 'next';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { prisma } from '@rgpv/db';
import { isValidEnrollment, normaliseEnrollment } from '@rgpv/shared';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { ResourceIcon } from '@/features/resources/resource-ui';
import { isFeatureOpen } from '@/lib/features';
import { getCurrentUser, isVerified } from '@/lib/session';
import { batchTag } from '@/lib/utils';

export const metadata: Metadata = { title: 'Search' };

/** Notes, papers and (for verified students, once the network is open) people. */
export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [{ q: raw = '' }, user] = await Promise.all([searchParams, getCurrentUser()]);
  const q = raw.trim().slice(0, 80);
  const enrollment = isValidEnrollment(q) ? normaliseEnrollment(q) : null;
  const canSeePeople = Boolean(user && isVerified(user) && isFeatureOpen('network', user.role));

  const [resources, people] = q.length >= 2
    ? await Promise.all([
        prisma.resource.findMany({
          where: {
            status: 'APPROVED',
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { subject: { name: { contains: q, mode: 'insensitive' } } },
              { subject: { code: { equals: q.toUpperCase() } } },
            ],
          },
          orderBy: [{ downloadCount: 'desc' }],
          take: 20,
          select: { id: true, type: true, title: true, session: true, subject: { select: { code: true, name: true } } },
        }),
        canSeePeople
          ? prisma.user.findMany({
              where: { verificationStatus: 'VERIFIED', role: { not: 'ADMIN' }, collegeId: user!.collegeId ?? '__none__', name: { contains: q, mode: 'insensitive' } },
              take: 10,
              select: { id: true, name: true, branchCode: true, graduatingBatch: true },
            })
          : Promise.resolve([]),
      ])
    : [[], []];

  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-5">
      <PageHeader title="Search" />
      <form action="/search" className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
        <Input name="q" defaultValue={q} autoFocus placeholder="A subject, a code like CS502, or a name" className="h-12 pl-9 text-[15px]" aria-label="Search" />
      </form>
      {enrollment ? (
        <Link href={`/results/lookup?enrollment=${enrollment}`} className="rounded-md border border-accent-strong bg-accent px-4 py-3 text-[13px] font-semibold text-accent-foreground">
          That looks like an enrollment number. Check its result →
        </Link>
      ) : null}
      {q.length < 2 ? null : resources.length === 0 && people.length === 0 ? (
        <Card><EmptyState icon={Search} title={`Nothing found for “${q}”`}>Try the subject code, or a shorter word.</EmptyState></Card>
      ) : (
        <>
          {people.length ? (
            <section className="flex flex-col gap-2">
              <h2 className="font-display text-sm font-bold">People at your college</h2>
              {people.map((p) => (
                <Link key={p.id} href={`/u/${p.id}`} className="flex items-center justify-between rounded-md border bg-card px-4 py-3 text-[13px] shadow-card hover:border-input">
                  <span className="font-semibold">{p.name}</span>
                  <Badge>{batchTag(p.branchCode, p.graduatingBatch)}</Badge>
                </Link>
              ))}
            </section>
          ) : null}
          {resources.length ? (
            <section className="flex flex-col gap-2">
              <h2 className="font-display text-sm font-bold">Notes and papers</h2>
              {resources.map((r) => (
                <Link key={r.id} href={`/resources/${r.id}`} className="grid grid-cols-[auto_1fr] items-center gap-3 rounded-md border bg-card px-4 py-3 shadow-card hover:border-input">
                  <ResourceIcon type={r.type} />
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold">{r.subject.code} · {r.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{r.subject.name}{r.session ? ` · ${r.session}` : ''}</span>
                  </span>
                </Link>
              ))}
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
