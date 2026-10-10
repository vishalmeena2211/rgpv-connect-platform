import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, Clock, Upload, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { getAllSubjects, getMyUploads } from '@/features/resources/queries';
import { RemoveUploadButton } from '@/features/resources/remove-upload';
import { ResourceIcon } from '@/features/resources/resource-ui';
import { UploadDialog } from '@/features/resources/upload-dialog';
import { isVerified, requireUser } from '@/lib/session';
import { formatCount, formatDate, formatWhen } from '@/lib/utils';

export const metadata: Metadata = { title: 'My uploads' };

/** What you shared and where each item is in review. */
export default async function UploadsPage() {
  const user = await requireUser('/uploads');
  const [uploads, subjects] = await Promise.all([getMyUploads(user.id), getAllSubjects()]);
  const canUpload = isVerified(user);

  return (
    <div className="mx-auto flex max-w-[860px] flex-col gap-5">
      <PageHeader
        title="My uploads"
        description="What you shared and where it is in review."
        actions={canUpload ? <UploadDialog subjects={subjects} trigger={<Button><Upload />Upload notes</Button>} /> : null}
      />
      {uploads.length === 0 ? (
        <Card>
          <EmptyState icon={Upload} title="Nothing shared yet" action={canUpload ? null : <Button asChild><Link href="/onboarding">Verify enrollment</Link></Button>}>
            {canUpload ? 'Your notes help the batch below you. Reviewers check each upload within two days.' : 'Verify your enrollment number to share notes and papers.'}
          </EmptyState>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {uploads.map((upload) => (
            <li key={upload.id} className="grid grid-cols-[auto_1fr] items-center gap-3 rounded-md border bg-card px-4 py-3 shadow-card sm:grid-cols-[auto_1fr_auto]">
              <ResourceIcon type={upload.type} />
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-[13px] font-semibold">
                  <Link href={`/resources/${upload.id}`} className="hover:underline">
                    {upload.subject.code} · {upload.title}
                  </Link>
                  {upload.status === 'APPROVED' ? (
                    <Badge variant="success"><Check />Published</Badge>
                  ) : upload.status === 'PENDING' ? (
                    <Badge variant="warning"><Clock />Waiting for review</Badge>
                  ) : (
                    <Badge variant="destructive"><X />Not published</Badge>
                  )}
                </p>
                <p className="text-xs leading-[17px] text-muted-foreground">
                  {upload.status === 'APPROVED'
                    ? `Approved ${upload.reviewedAt ? formatDate(upload.reviewedAt) : ''} · ${formatCount(upload.downloadCount)} downloads${upload.ratingCount ? ` · ${upload.rating.toFixed(1)} (${upload.ratingCount})` : ''}`
                    : upload.status === 'PENDING'
                      ? `Uploaded ${formatWhen(upload.createdAt).toLowerCase()} · reviews usually take under two days · only you can see it until then`
                      : `A reviewer said: “${upload.reviewNote ?? 'No reason given'}” You can fix it and send it again.`}
                </p>
              </div>
              <div className="col-span-2 flex justify-end gap-2 sm:col-span-1">
                {upload.status === 'REJECTED' ? (
                  <UploadDialog
                    subjects={subjects}
                    editing={{ id: upload.id, title: upload.title, unitName: upload.unitName, session: upload.session, subjectId: upload.subject.id, type: upload.type }}
                    trigger={<Button size="sm" variant="outline">Edit and resend</Button>}
                  />
                ) : upload.status === 'APPROVED' ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/resources/${upload.id}`}>Open</Link>
                  </Button>
                ) : null}
                <RemoveUploadButton id={upload.id} title={upload.title} published={upload.status === 'APPROVED'} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
