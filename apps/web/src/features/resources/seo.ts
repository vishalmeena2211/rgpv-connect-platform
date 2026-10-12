import type { Metadata } from 'next';

import { openGraph } from '@/lib/site';

import { getCatalogueBranches } from './queries';

/**
 * Title, description and canonical address for the notes and papers lists.
 * A list opened for one branch and semester gets its own title, such as
 * "RGPV Computer Science semester 4 notes", because that is what students
 * search for; the bare list gets the general one.
 */
export async function scopeMetadata(
  kind: 'notes' | 'papers',
  query: { branch?: string; semester?: string },
): Promise<Metadata> {
  const noun = kind === 'notes' ? 'notes' : 'previous year papers';
  const semester = Number(query.semester);
  const validSemester = Number.isInteger(semester) && semester >= 1 && semester <= 8;
  const branches = query.branch && validSemester ? await getCatalogueBranches().catch(() => []) : [];
  const branch = branches.find((b) => b.code === query.branch?.toUpperCase());

  if (!branch || !validSemester) {
    const title = kind === 'notes' ? 'RGPV notes by branch and semester' : 'RGPV previous year question papers';
    const description =
      kind === 'notes'
        ? 'Free RGPV B.Tech notes for every branch and semester, shared by verified students and checked by reviewers before they go up.'
        : 'RGPV end-semester question papers for every branch and semester, newest exam first, free to view and download.';
    return { title, description, alternates: { canonical: `/${kind}` }, openGraph: openGraph(title, description, `/${kind}`) };
  }

  const canonical = `/${kind}?branch=${branch.code}&semester=${semester}`;
  const title = `RGPV ${branch.name} semester ${semester} ${noun}`;
  const description =
    kind === 'notes'
      ? `Free RGPV ${branch.name} (${branch.code}) semester ${semester} notes, subject by subject, shared by verified students.`
      : `RGPV ${branch.name} (${branch.code}) semester ${semester} previous year question papers, newest exam first.`;
  return { title, description, alternates: { canonical }, openGraph: openGraph(title, description, canonical) };
}
