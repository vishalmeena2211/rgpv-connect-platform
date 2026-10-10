import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { getAllSubjects, getCatalogueBranches, getPapersBySubject, resolveScope } from '@/features/resources/queries';
import { ScopeBar } from '@/features/resources/resource-ui';
import { UploadDialog } from '@/features/resources/upload-dialog';
import { getCurrentUser, isVerified } from '@/lib/session';

export const metadata: Metadata = { title: 'Papers' };

/** End-semester papers as one table per subject, newest exam first. */
export default async function PapersPage({ searchParams }: { searchParams: Promise<{ branch?: string; semester?: string }> }) {
  const [query, user] = await Promise.all([searchParams, getCurrentUser()]);
  const scope = resolveScope(query, user);
  const [branches, groups, allSubjects] = await Promise.all([
    getCatalogueBranches(),
    getPapersBySubject(scope),
    isVerified(user) ? getAllSubjects() : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-5">
      <PageHeader
        title="Papers"
        description="End-semester question papers, by subject and year."
        actions={
          isVerified(user) ? (
            <UploadDialog subjects={allSubjects} defaultType="PAPER" defaultSubjectId={groups[0]?.subject.id} trigger={<Button><Upload />Upload a paper</Button>} />
          ) : null
        }
      />
      <ScopeBar scope={scope} branches={branches} basePath="/papers" />
      {groups.length === 0 ? (
        <Card>
          <EmptyState icon={FileText} title={`No subjects for ${scope.branchName} semester ${scope.semester} yet`}>
            The catalogue for this branch and semester is not set up. Pick another, or ask on GitHub for it to be added.
          </EmptyState>
        </Card>
      ) : (
        groups.map(({ subject, papers }) =>
          papers.length === 0 ? (
            <div key={subject.id} className="flex items-center gap-3 rounded-md border border-dashed bg-card/60 px-4 py-3 text-[13px] text-muted-foreground">
              <FileText className="size-4 shrink-0" />
              <span>
                <b className="text-foreground">No papers for {subject.code} {subject.name} yet.</b> If you sat it, you can upload the paper from the exam.
              </span>
            </div>
          ) : (
            <Card key={subject.id}>
              <CardHeader>
                <CardTitle>
                  {subject.code} · {subject.name}
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  {papers.length} paper{papers.length === 1 ? '' : 's'}
                </span>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead className="bg-subtle text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-faint">
                    <tr>
                      <th className="px-[18px] py-2.5">Exam</th>
                      <th className="px-3 py-2.5">Shared by</th>
                      <th className="px-3 py-2.5 text-right">Pages</th>
                      <th className="px-[18px] py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {papers.map((paper) => (
                      <tr key={paper.id} className="border-t">
                        <td className="px-[18px] py-2.5 font-semibold">{paper.session ?? paper.title} · end semester</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{paper.uploader.name}</td>
                        <td className="px-3 py-2.5 text-right tabular">{paper.pageCount ?? '—'}</td>
                        <td className="px-[18px] py-2.5 text-right">
                          <Link href={`/resources/${paper.id}`} className="font-semibold text-accent-foreground">
                            Open
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ),
        )
      )}
    </div>
  );
}
