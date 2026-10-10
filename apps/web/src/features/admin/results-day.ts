import 'server-only';

import { type Prisma, prisma } from '@rgpv/db';

import { notify } from '@/features/notifications/notify';
import { lookupResult } from '@/features/results/service';

/** How many students one step processes; small enough for a serverless call. */
export const STEP_SIZE = 4;

export interface SampleCheck {
  checked: number;
  found: number;
  notDeclared: number;
  failed: number;
}

/**
 * Before a run: ask the portal about five random verified students of the
 * batch. Fewer than all five found means the semester is probably not out yet.
 */
export async function sampleBatch(semester: number, admissionYear: number): Promise<SampleCheck> {
  const ids = await prisma.user.findMany({
    where: { admissionYear, verificationStatus: 'VERIFIED', enrollmentNumber: { not: null } },
    select: { enrollmentNumber: true },
  });
  const sample = ids
    .map((u) => u.enrollmentNumber as string)
    .sort(() => Math.random() - 0.5)
    .slice(0, 5);
  const outcomes = await Promise.all(sample.map((enrollment) => lookupResult(enrollment, semester, { fresh: true, limit: false })));
  return {
    checked: sample.length,
    found: outcomes.filter((o) => o.kind === 'found').length,
    notDeclared: outcomes.filter((o) => o.kind === 'not_declared').length,
    failed: outcomes.filter((o) => o.kind === 'unavailable').length,
  };
}

/**
 * One step of a run: fetch the next few students after the cursor, save their
 * result, and notify those who allow it. Returns true while work remains.
 */
export async function advanceDeclaration(id: string): Promise<boolean> {
  const run = await prisma.resultsDeclaration.findUnique({ where: { id } });
  if (!run || run.status !== 'RUNNING') return false;

  const students = await prisma.user.findMany({
    where: {
      admissionYear: run.admissionYear,
      verificationStatus: 'VERIFIED',
      enrollmentNumber: { not: null },
      ...(run.cursor ? { id: { gt: run.cursor } } : {}),
    },
    orderBy: { id: 'asc' },
    take: STEP_SIZE,
    select: { id: true, enrollmentNumber: true },
  });

  if (students.length === 0) {
    await prisma.resultsDeclaration.update({ where: { id }, data: { status: 'COMPLETED', finishedAt: new Date() } });
    return false;
  }

  let fetched = 0;
  let failed = 0;
  let notified = 0;
  for (const student of students) {
    const outcome = await lookupResult(student.enrollmentNumber!, run.semester, { fresh: true, limit: false });
    if (outcome.kind === 'found') {
      fetched += 1;
      const result = outcome.result;
      const fields = {
        status: result.status,
        sgpa: result.sgpa ?? null,
        cgpa: result.cgpa ?? null,
        payload: result as unknown as Prisma.InputJsonValue,
        fetchedAt: new Date(),
      };
      await prisma.resultRecord.upsert({
        where: { userId_semester: { userId: student.id, semester: run.semester } },
        create: { userId: student.id, semester: run.semester, ...fields },
        update: fields,
      });
      await notify({
        recipientId: student.id,
        type: 'RESULT_DECLARED',
        entityId: String(run.semester),
        data: { semester: run.semester, sgpa: result.sgpa ?? null },
        push: {
          title: `Semester ${run.semester} results are out`,
          body: result.sgpa != null ? `Your SGPA: ${result.sgpa.toFixed(2)}. Tap to see every subject.` : 'Tap to see your result.',
          url: '/results/me',
          tag: `results-${run.semester}`,
        },
      });
      notified += 1;
    } else {
      failed += 1;
      await notify({
        recipientId: student.id,
        type: 'RESULT_DECLARED',
        entityId: String(run.semester),
        data: { semester: run.semester, sgpa: null },
        push: { title: `Semester ${run.semester} results are out`, body: 'We could not fetch yours yet. Tap to try again.', url: '/results/me', tag: `results-${run.semester}` },
      });
      notified += 1;
    }
  }

  await prisma.resultsDeclaration.update({
    where: { id },
    data: {
      cursor: students.at(-1)!.id,
      processed: { increment: students.length },
      fetched: { increment: fetched },
      failed: { increment: failed },
      notified: { increment: notified },
    },
  });
  return true;
}
