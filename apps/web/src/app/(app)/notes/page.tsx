import type { Metadata } from 'next';
import { NotebookText, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { getAllSubjects, getCatalogueBranches, getResources, getSubjects, resolveScope } from '@/features/resources/queries';
import { ResourceCard, ScopeBar, SubjectChips } from '@/features/resources/resource-ui';
import { scopeMetadata } from '@/features/resources/seo';
import { UploadDialog } from '@/features/resources/upload-dialog';
import { getCurrentUser, isVerified } from '@/lib/session';

export function generateMetadata({ searchParams }: { searchParams: Promise<{ branch?: string; semester?: string }> }): Promise<Metadata> {
  return searchParams.then((query) => scopeMetadata('notes', query));
}

/** Notes for one branch + semester, picked from the viewer's enrollment by default. */
export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string; semester?: string; subject?: string }>;
}) {
  const [query, user] = await Promise.all([searchParams, getCurrentUser()]);
  const scope = resolveScope(query, user);
  const subjectId = Number(query.subject) || undefined;
  const [branches, subjects, { items, total }, allSubjects] = await Promise.all([
    getCatalogueBranches(),
    getSubjects(scope),
    getResources('NOTE', scope, subjectId),
    isVerified(user) ? getAllSubjects() : Promise.resolve([]),
  ]);
  const href = (id: number | null) => `/notes?branch=${scope.branchCode}&semester=${scope.semester}${id ? `&subject=${id}` : ''}`;
  const upload = isVerified(user) ? (
    <UploadDialog subjects={allSubjects} defaultSubjectId={subjectId ?? subjects[0]?.id} trigger={<Button><Upload />Upload notes</Button>} />
  ) : null;

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-5">
      <PageHeader
        title="Notes"
        description={user?.branchCode ? 'Shared by verified RGPV students. Your branch and semester are picked for you.' : 'Shared by verified RGPV students, sorted by branch and semester.'}
        actions={upload}
      />
      <ScopeBar scope={scope} branches={branches} basePath="/notes" />
      {subjects.length > 0 ? <SubjectChips subjects={subjects} active={subjectId ?? null} hrefFor={href} /> : null}
      {items.length === 0 ? (
        <Card>
          <EmptyState icon={NotebookText} title={subjectId ? 'No notes for this subject yet' : `No notes for semester ${scope.semester} yet`} action={upload}>
            {isVerified(user) ? 'If you have good notes, share them. Reviewers check them within two days.' : 'Verified students can share notes here.'}
          </EmptyState>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            {items.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Showing {items.length} of {total} for semester {scope.semester}
          </p>
        </>
      )}
    </div>
  );
}
