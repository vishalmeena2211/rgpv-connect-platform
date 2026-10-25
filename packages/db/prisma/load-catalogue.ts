/**
 * Load RGPV's official B.Tech subject lists into the catalogue.
 *
 * The data is `catalogue/btech.json`, read from RGPV's own "Scheme of
 * Examination" PDFs (rgpv.ac.in → Scheme → B.Tech → Grading System); each
 * semester records the file it came from and the credits on its Total row.
 *
 *   pnpm --filter @rgpv/db catalogue:load            # preview, writes nothing
 *   pnpm --filter @rgpv/db catalogue:load --apply    # write
 *
 * It only adds and updates: a subject already in the database but not in the
 * file is listed and left alone, so notes and papers attached to it are safe.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PrismaClient } from '@prisma/client';

interface SubjectRow {
  code: string;
  name: string;
  credits: number | null;
}

interface Catalogue {
  course: string;
  branches: Record<string, { name: string; semesters: Record<string, { source: string; totalCredits: number | null; subjects: SubjectRow[] }> }>;
}

const apply = process.argv.includes('--apply');
const here = dirname(fileURLToPath(import.meta.url));
const catalogue = JSON.parse(readFileSync(join(here, 'catalogue', 'btech.json'), 'utf8')) as Catalogue;
const prisma = new PrismaClient();

/** The file must add up before anything is written. */
function check(): string[] {
  const problems: string[] = [];
  for (const [code, branch] of Object.entries(catalogue.branches)) {
    for (const [number, semester] of Object.entries(branch.semesters)) {
      const codes = semester.subjects.map((s) => s.code);
      const duplicate = codes.find((c, i) => codes.indexOf(c) !== i);
      if (duplicate) problems.push(`${code} semester ${number}: ${duplicate} appears twice`);
      const sum = semester.subjects.reduce((total, s) => total + (s.credits ?? 0), 0);
      if (semester.totalCredits != null && sum !== semester.totalCredits) {
        problems.push(`${code} semester ${number}: credits add up to ${sum}, RGPV's Total says ${semester.totalCredits}`);
      }
    }
  }
  return problems;
}

async function main() {
  const problems = check();
  if (problems.length) {
    console.error(`Not loading: the file does not add up.\n  ${problems.join('\n  ')}`);
    process.exitCode = 1;
    return;
  }

  const totals = { created: 0, updated: 0, unchanged: 0, untouched: 0 };
  const course = apply
    ? await prisma.course.upsert({ where: { name: catalogue.course }, update: {}, create: { name: catalogue.course } })
    : await prisma.course.findUnique({ where: { name: catalogue.course } });

  for (const [code, branch] of Object.entries(catalogue.branches)) {
    for (const [key, semester] of Object.entries(branch.semesters)) {
      const number = Number(key);
      const yearNumber = Math.ceil(number / 2);

      // Find (or, with --apply, create) the semester row and what it already holds.
      let semesterId: number | null = null;
      if (course) {
        const year = apply
          ? await prisma.year.upsert({ where: { courseId_number: { courseId: course.id, number: yearNumber } }, update: {}, create: { courseId: course.id, number: yearNumber } })
          : await prisma.year.findUnique({ where: { courseId_number: { courseId: course.id, number: yearNumber } } });
        const branchRow = year
          ? apply
            ? await prisma.branch.upsert({ where: { yearId_code: { yearId: year.id, code } }, update: { name: branch.name }, create: { yearId: year.id, code, name: branch.name } })
            : await prisma.branch.findUnique({ where: { yearId_code: { yearId: year.id, code } } })
          : null;
        const semesterRow = branchRow
          ? apply
            ? await prisma.semester.upsert({ where: { branchId_number: { branchId: branchRow.id, number } }, update: {}, create: { branchId: branchRow.id, number } })
            : await prisma.semester.findUnique({ where: { branchId_number: { branchId: branchRow.id, number } } })
          : null;
        semesterId = semesterRow?.id ?? null;
      }
      const existing = semesterId
        ? await prisma.subject.findMany({ where: { semesterId }, select: { id: true, code: true, name: true, credits: true } })
        : [];
      const byCode = new Map(existing.map((s) => [s.code, s]));

      const counts = { created: 0, updated: 0, unchanged: 0 };
      const writes = [];
      for (const subject of semester.subjects) {
        const current = byCode.get(subject.code);
        if (!current) counts.created++;
        else if (current.name !== subject.name || current.credits !== subject.credits) counts.updated++;
        else counts.unchanged++;
        if (apply && semesterId && (!current || current.name !== subject.name || current.credits !== subject.credits)) {
          writes.push(
            prisma.subject.upsert({
              where: { semesterId_code: { semesterId, code: subject.code } },
              update: { name: subject.name, credits: subject.credits },
              create: { semesterId, code: subject.code, name: subject.name, credits: subject.credits },
            }),
          );
        }
      }
      if (writes.length) await prisma.$transaction(writes);

      const listed = new Set(semester.subjects.map((s) => s.code));
      const untouched = existing.filter((s) => !s.code || !listed.has(s.code));
      totals.created += counts.created;
      totals.updated += counts.updated;
      totals.unchanged += counts.unchanged;
      totals.untouched += untouched.length;
      console.log(
        `${code} sem ${number}: ${semester.subjects.length} subjects (${counts.created} new, ${counts.updated} changed, ${counts.unchanged} same)` +
          (untouched.length ? `; left as is, not in RGPV's list: ${untouched.map((s) => `${s.code ?? '(no code)'} ${s.name}`).join(', ')}` : ''),
      );
    }
  }

  console.log(
    `\n${apply ? 'Loaded' : 'Preview only, nothing written'}: ${totals.created} new, ${totals.updated} changed, ${totals.unchanged} same, ${totals.untouched} left as is.` +
      (apply ? '' : '\nRun again with --apply to write.'),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
