import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Download, ExternalLink } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Card, CardContent } from '@/components/ui/card';
import { Stars } from '@/components/ui/stars';
import { getResource } from '@/features/resources/queries';
import { RateControl } from '@/features/resources/rate-control';
import { getCurrentUser, isVerified } from '@/lib/session';
import { batchTag, formatBytes, formatCount, formatDate } from '@/lib/utils';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const resource = await getResource(id, null);
  return { title: resource ? `${resource.subject.code ?? ''} ${resource.title}`.trim() : 'Notes' };
}

/** One note or paper: the file inline, rating, download, and who shared it. */
export default async function ResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const resource = await getResource(id, user ? { id: user.id, role: user.role } : null);
  if (!resource) notFound();

  const isPdf = resource.pdfUrl.endsWith('.pdf') || resource.pdfUrl.includes('.pdf?');
  const back = resource.type === 'NOTE' ? '/notes' : '/papers';

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-4">
      <Link href={back} className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-3.5" />
        {resource.type === 'NOTE' ? 'Notes' : 'Papers'}
      </Link>
      {resource.status !== 'APPROVED' ? (
        <Callout tone={resource.status === 'REJECTED' ? 'danger' : 'warning'} title={resource.status === 'REJECTED' ? 'Not published' : 'Waiting for review'}>
          {resource.status === 'REJECTED'
            ? `A reviewer said: “${resource.reviewNote ?? 'see My uploads'}”`
            : 'Only you can see this until a reviewer publishes it, usually within two days.'}
        </Callout>
      ) : null}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
            {resource.subject.code} · {resource.subject.name}
          </p>
          <h1 className="font-display text-2xl font-bold tracking-[-0.02em]">{resource.title}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Stars rating={resource.rating} count={resource.ratingCount} />
            <span className="text-faint">·</span>
            <span className="tabular">{formatCount(resource.downloadCount)} downloads</span>
            {resource.fileSize ? (
              <>
                <span className="text-faint">·</span>
                <span>{formatBytes(resource.fileSize)}</span>
              </>
            ) : null}
            <span className="text-faint">·</span>
            <span>Shared {formatDate(resource.createdAt)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <a href={resource.pdfUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink />
              Open in a new tab
            </a>
          </Button>
          {resource.status === 'APPROVED' ? (
            <Button asChild>
              <a href={`/api/resources/${resource.id}/download`}>
                <Download />
                Download
              </a>
            </Button>
          ) : null}
        </div>
      </header>

      <Card className="overflow-hidden">
        {isPdf ? (
          <iframe src={`${resource.pdfUrl}#view=FitH`} title={resource.title} className="h-[70dvh] w-full bg-muted" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={resource.pdfUrl} alt={resource.title} className="mx-auto max-h-[80dvh] w-auto" />
        )}
      </Card>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <Link href={`/u/${resource.uploader.id}`} className="flex items-center gap-2 text-[13px]">
            <span className="font-semibold">{resource.uploader.name}</span>
            {batchTag(resource.uploader.branchCode, resource.uploader.graduatingBatch) ? (
              <span className="text-muted-foreground">{batchTag(resource.uploader.branchCode, resource.uploader.graduatingBatch)}</span>
            ) : null}
            {resource.uploader.verified ? <Badge variant="verified">Verified</Badge> : null}
          </Link>
          {resource.status === 'APPROVED' ? (
            <RateControl
              id={resource.id}
              initial={resource.myStars}
              disabledReason={!user ? 'Sign in to rate.' : !isVerified(user) ? 'Verify your enrollment to rate.' : resource.isOwn ? 'You shared this one.' : undefined}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
