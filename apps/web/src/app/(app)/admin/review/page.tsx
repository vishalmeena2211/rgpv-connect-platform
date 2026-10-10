import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, Clock, Inbox } from 'lucide-react';
import { prisma } from '@rgpv/db';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChipLink, ChipRow } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { ListingDecision, PostDecision, ResourceDecision } from '@/features/admin/admin-client';
import { batchTag, cn, formatBytes, formatWhen, relativeTime } from '@/lib/utils';

export const metadata: Metadata = { title: 'Review queue' };

const REASON = { OFF_TOPIC: 'off topic', SPAM: 'spam', HARASSMENT: 'harassment', PERSONAL_INFO: 'personal information', OTHER: 'other' } as const;

/** Queue on the left, the item on the right, the decision at the bottom. */
export default async function ReviewPage({ searchParams }: { searchParams: Promise<{ filter?: string; item?: string }> }) {
  const { filter = 'all', item } = await searchParams;
  const [resources, posts, listings] = await Promise.all([
    prisma.resource.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      include: { uploader: { select: { name: true, branchCode: true, graduatingBatch: true, verificationStatus: true, college: { select: { shortName: true } }, _count: { select: { resources: { where: { status: 'APPROVED' } } } } } }, subject: { select: { code: true, name: true, semester: { select: { number: true } } } } },
    }),
    prisma.post.findMany({
      where: { removedAt: null, reports: { some: { status: 'OPEN' } } },
      orderBy: { createdAt: 'asc' },
      include: { author: { select: { name: true, branchCode: true, graduatingBatch: true } }, reports: { where: { status: 'OPEN' }, select: { reason: true, note: true } } },
    }),
    prisma.marketListing.findMany({
      where: { reports: { some: { status: 'OPEN' } } },
      include: { seller: { select: { name: true } }, reports: { where: { status: 'OPEN' }, select: { reason: true, note: true } } },
    }),
  ]);

  type Row = { key: string; title: string; sub: string; tone: 'warning' | 'destructive'; badge: string; at: Date };
  const rows: Row[] = [
    ...(filter !== 'reports'
      ? resources.map((r) => ({
          key: `r:${r.id}`,
          title: `${r.subject.code} · ${r.title}`,
          sub: `${r.uploader.name} · ${batchTag(r.uploader.branchCode, r.uploader.graduatingBatch) ?? ''} · ${formatBytes(r.fileSize) ?? ''} · ${relativeTime(r.createdAt.toISOString())}`,
          tone: 'warning' as const,
          badge: 'Waiting',
          at: r.createdAt,
        }))
      : []),
    ...(filter !== 'uploads'
      ? [
          ...posts.map((p) => ({
            key: `p:${p.id}`,
            title: `Reported post · “${p.body.slice(0, 48)}${p.body.length > 48 ? '…' : ''}”`,
            sub: `By ${p.author.name} · ${p.reports.length} report${p.reports.length === 1 ? '' : 's'}: ${REASON[p.reports[0]!.reason]}${p.hiddenAt ? ' · hidden' : ''}`,
            tone: 'destructive' as const,
            badge: 'Reported',
            at: p.createdAt,
          })),
          ...listings.map((l) => ({
            key: `l:${l.id}`,
            title: `Reported listing · ${l.title}`,
            sub: `By ${l.seller.name} · ${l.reports.length} report${l.reports.length === 1 ? '' : 's'}: ${REASON[l.reports[0]!.reason]}`,
            tone: 'destructive' as const,
            badge: 'Reported',
            at: l.createdAt,
          })),
        ]
      : []),
  ];
  const total = resources.length + posts.length + listings.length;
  const selected = item ?? rows[0]?.key;
  const [kind, id] = selected?.split(':') ?? [];
  const resource = kind === 'r' ? resources.find((r) => r.id === id) : undefined;
  const post = kind === 'p' ? posts.find((p) => p.id === id) : undefined;
  const listing = kind === 'l' ? listings.find((l) => l.id === id) : undefined;
  const duplicate = resource
    ? await prisma.resource.findFirst({ where: { id: { not: resource.id }, subjectId: resource.subjectId, status: 'APPROVED', OR: [{ title: { equals: resource.title, mode: 'insensitive' } }, ...(resource.session ? [{ session: resource.session, type: 'PAPER' as const }] : [])] }, select: { id: true, title: true } })
    : null;
  const oldest = rows.length ? rows.reduce((a, b) => (a.at < b.at ? a : b)).at : null;
  const href = (f: string, i?: string) => `/admin/review?filter=${f}${i ? `&item=${encodeURIComponent(i)}` : ''}`;

  return (
    <>
      <PageHeader title="Review queue" description={total ? `${total} waiting · oldest ${relativeTime(oldest!.toISOString())}` : 'Nothing waiting'} />
      <ChipRow>
        <ChipLink href={href('all')} on={filter === 'all'}>All ({total})</ChipLink>
        <ChipLink href={href('uploads')} on={filter === 'uploads'}>Notes and papers ({resources.length})</ChipLink>
        <ChipLink href={href('reports')} on={filter === 'reports'}>Reports ({posts.length + listings.length})</ChipLink>
      </ChipRow>
      {rows.length === 0 ? (
        <Card><EmptyState icon={Inbox} title="Nothing waiting for review">New uploads and reported posts land here. Uploaders are told the moment you decide.</EmptyState></Card>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <ul className="flex flex-col gap-2">
            {rows.map((row) => (
              <li key={row.key}>
                <Link href={href(filter, row.key)} className={cn('grid grid-cols-[1fr_auto] items-center gap-3 rounded-md border bg-card px-4 py-3 shadow-card hover:border-input', row.key === selected && 'border-accent-strong bg-accent/40')}>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold">{row.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{row.sub}</span>
                  </span>
                  <Badge variant={row.tone}>{row.badge}</Badge>
                </Link>
              </li>
            ))}
          </ul>
          <Card>
            {resource ? (
              <>
                <CardHeader>
                  <CardTitle>{resource.subject.code} · {resource.title}</CardTitle>
                  <span className="text-xs text-muted-foreground">Uploaded {formatWhen(resource.createdAt)}</span>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <iframe src={resource.pdfUrl} title="Preview" className="h-72 w-full rounded-md border bg-muted" />
                  <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-1.5 text-[13px]">
                    <dt className="text-muted-foreground">Uploader</dt>
                    <dd>{resource.uploader.name} {resource.uploader.verificationStatus === 'VERIFIED' ? <Badge variant="verified">Verified</Badge> : null} · {batchTag(resource.uploader.branchCode, resource.uploader.graduatingBatch)} · {resource.uploader.college?.shortName} · {resource.uploader._count.resources} published before</dd>
                    <dt className="text-muted-foreground">Subject</dt>
                    <dd>{resource.subject.code} {resource.subject.name} · semester {resource.subject.semester.number}</dd>
                    {resource.session ? (<><dt className="text-muted-foreground">Exam</dt><dd>{resource.session}</dd></>) : null}
                    <dt className="text-muted-foreground">Declared</dt>
                    <dd>{resource.declaredOwnWork ? 'Own notes, permission to share' : 'Not confirmed'}</dd>
                  </dl>
                  <ul className="flex flex-col gap-1.5 text-[13px]">
                    <li className="flex items-center gap-2">
                      {duplicate ? <Clock className="size-4 text-warning" /> : <CheckCircle2 className="size-4 text-success" />}
                      {duplicate ? `Looks like a duplicate of “${duplicate.title}”` : `Not a duplicate of an existing ${resource.subject.code} upload`}
                    </li>
                    <li className="flex items-center gap-2"><Clock className="size-4 text-warning" />Matches the subject: check the first pages</li>
                  </ul>
                  <ResourceDecision id={resource.id} />
                </CardContent>
              </>
            ) : post ? (
              <>
                <CardHeader>
                  <CardTitle>Post by {post.author.name}</CardTitle>
                  <span className="text-xs text-muted-foreground">{post.hiddenAt ? 'Hidden until you decide' : 'Still visible'}</span>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <p className="whitespace-pre-wrap rounded-md border bg-subtle p-3 text-[13.5px]">{post.body}</p>
                  <ul className="flex flex-col gap-1 text-[13px]">
                    {post.reports.map((r, i) => (
                      <li key={i}>Report {i + 1}: {REASON[r.reason]}{r.note ? ` · “${r.note}”` : ''}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground">Removing tells the author why. Three removals in 90 days pause their posting for 30 days.</p>
                  <PostDecision id={post.id} />
                </CardContent>
              </>
            ) : listing ? (
              <>
                <CardHeader><CardTitle>Listing by {listing.seller.name}</CardTitle></CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <p className="text-[13.5px]"><b>{listing.title}</b> · {listing.description}</p>
                  <ul className="flex flex-col gap-1 text-[13px]">{listing.reports.map((r, i) => <li key={i}>Report {i + 1}: {REASON[r.reason]}{r.note ? ` · “${r.note}”` : ''}</li>)}</ul>
                  <ListingDecision id={listing.id} />
                </CardContent>
              </>
            ) : (
              <EmptyState icon={Inbox} title="Pick an item" />
            )}
          </Card>
        </div>
      )}
    </>
  );
}
