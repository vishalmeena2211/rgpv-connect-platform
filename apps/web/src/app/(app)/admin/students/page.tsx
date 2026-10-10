import type { Metadata } from 'next';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { prisma } from '@rgpv/db';
import { density } from '@rgpv/shared';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Progress } from '@/components/ui/progress';
import { CohortSizeForm, RoleSelect } from '@/features/admin/admin-client';
import { batchTag } from '@/lib/utils';

export const metadata: Metadata = { title: 'Students' };

/** Batch density against hand-entered sizes, and account lookup with roles. */
export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const [sizes, colleges, users] = await Promise.all([
    prisma.cohortSize.findMany({ orderBy: [{ collegeCode: 'asc' }, { graduatingBatch: 'desc' }] }),
    prisma.college.findMany({ select: { id: true, code: true, shortName: true, name: true } }),
    q
      ? prisma.user.findMany({
          where: { OR: [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }, { enrollmentNumber: { contains: q.toUpperCase() } }] },
          take: 25,
          select: { id: true, name: true, email: true, enrollmentNumber: true, verificationStatus: true, role: true, branchCode: true, graduatingBatch: true },
        })
      : Promise.resolve([]),
  ]);
  const verifiedCounts = await Promise.all(
    sizes.map((s) => {
      const college = colleges.find((c) => c.code === s.collegeCode);
      return college
        ? prisma.user.count({ where: { verificationStatus: 'VERIFIED', collegeId: college.id, branchCode: s.branchCode, graduatingBatch: s.graduatingBatch } })
        : Promise.resolve(0);
    }),
  );

  return (
    <>
      <PageHeader title="Students" description="Batch density for the launch target, and account roles." />
      <Card>
        <CardHeader>
          <CardTitle>Batch density</CardTitle>
          <span className="text-xs text-muted-foreground">A batch opens the network at about a third verified</span>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ul className="flex flex-col gap-3">
            {sizes.map((s, i) => {
              const d = density(verifiedCounts[i] ?? 0, s.size);
              const college = colleges.find((c) => c.code === s.collegeCode);
              return (
                <li key={s.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5">
                  <span className="text-[13px] font-semibold">
                    {s.branchCode} {s.graduatingBatch} · {college?.shortName ?? s.collegeCode}
                  </span>
                  <span className="text-xs text-muted-foreground tabular">
                    {d.verified} of {s.size} {d.reached ? <Badge variant="success">Reached</Badge> : null}
                  </span>
                  <Progress value={(d.ratio ?? 0) * 100} className="col-span-2" />
                </li>
              );
            })}
          </ul>
          <CohortSizeForm collegeCodes={colleges.map((c) => c.code)} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Find an account</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-3">
          <form action="/admin/students" className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <Input name="q" defaultValue={q} placeholder="Name, email or enrollment" className="pl-9" aria-label="Search accounts" />
          </form>
          {q ? (
            users.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">No account matches “{q}”.</p>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-[13px]">
                  <thead className="bg-subtle text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-faint">
                    <tr><th className="px-3.5 py-2.5">Name</th><th className="px-3.5 py-2.5">Enrollment</th><th className="px-3.5 py-2.5">Status</th><th className="px-3.5 py-2.5">Role</th></tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-t">
                        <td className="px-3.5 py-2"><Link href={`/u/${u.id}`} className="font-semibold">{u.name}</Link><span className="block text-xs text-muted-foreground">{u.email}</span></td>
                        <td className="px-3.5 py-2 tabular">{u.enrollmentNumber ?? '—'} <span className="text-xs text-muted-foreground">{batchTag(u.branchCode, u.graduatingBatch)}</span></td>
                        <td className="px-3.5 py-2"><Badge variant={u.verificationStatus === 'VERIFIED' ? 'verified' : 'default'}>{u.verificationStatus === 'VERIFIED' ? 'Verified' : 'Not verified'}</Badge></td>
                        <td className="px-3.5 py-2"><RoleSelect userId={u.id} role={u.role} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <p className="text-xs text-muted-foreground">Give placement cells and recruiters the Recruiter role so they can post jobs.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
