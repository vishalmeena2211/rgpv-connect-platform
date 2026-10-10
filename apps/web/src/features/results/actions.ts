'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { type Prisma, prisma } from '@rgpv/db';
import { parseEnrollment, semesterSchedule } from '@rgpv/shared';

import { appUrl } from '@/lib/app-url';
import { getCurrentUser, isVerified } from '@/lib/session';
import { maskEnrollment } from '@/lib/utils';

import { getSavedResults, getStanding } from './queries';
import { lookupResult } from './service';
import { createShareCard, type ShareCardData } from './share';

export type SyncOutcome =
  | { semester: number; kind: 'saved'; sgpa: number | null; cgpa: number | null }
  | { semester: number; kind: 'not_declared' }
  | { semester: number; kind: 'failed'; message: string };

/**
 * Fetch one semester for the signed-in verified user and save it. The client
 * calls this once per pending semester, which is what lets the page show
 * progress line by line and keep whatever succeeded.
 */
export async function syncSemester(semester: number): Promise<SyncOutcome> {
  const user = await getCurrentUser();
  if (!user || !isVerified(user) || !user.enrollmentNumber) {
    return { semester, kind: 'failed', message: 'Verify your enrollment number first.' };
  }
  if (!Number.isInteger(semester) || semester < 1 || semester > 8) {
    return { semester, kind: 'failed', message: 'That semester does not exist.' };
  }

  const outcome = await lookupResult(user.enrollmentNumber, semester, { fresh: true, limitKey: `sync:${user.id}` });

  if (outcome.kind === 'found') {
    const result = outcome.result;
    const fields = {
      status: result.status,
      sgpa: result.sgpa ?? null,
      cgpa: result.cgpa ?? null,
      payload: result as unknown as Prisma.InputJsonValue,
      fetchedAt: new Date(),
    };
    await prisma.resultRecord.upsert({
      where: { userId_semester: { userId: user.id, semester } },
      create: { userId: user.id, semester, ...fields },
      update: fields,
    });
    revalidatePath('/results/me');
    return { semester, kind: 'saved', sgpa: fields.sgpa, cgpa: fields.cgpa };
  }
  if (outcome.kind === 'not_declared') return { semester, kind: 'not_declared' };
  if (outcome.kind === 'rate_limited') {
    return { semester, kind: 'failed', message: `Too many fetches. Try again in ${Math.ceil(outcome.retryAfterSeconds / 60)} min.` };
  }
  return { semester, kind: 'failed', message: "RGPV's portal rejected three attempts." };
}

/** Turn the semester board listing on or off for the signed-in user. */
export async function setShowOnBoard(on: boolean): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  await prisma.user.update({ where: { id: user.id }, data: { showOnBoard: on } });
  revalidatePath('/results/me');
  revalidatePath('/settings');
  return { ok: true };
}

export type ShareResult = { ok: true; url: string; token: string } | { ok: false; error: string };

/** A share card for one of the signed-in user's own saved semesters, with their name. */
export async function shareMyResult(params: {
  semester: number;
  showCgpa: boolean;
  showRank: boolean;
}): Promise<ShareResult> {
  const user = await getCurrentUser();
  if (!user || !isVerified(user) || !user.enrollmentNumber) return { ok: false, error: 'Verify your enrollment to share with your name.' };

  const saved = await getSavedResults(user.id);
  const record = saved.find((r) => r.semester === params.semester);
  if (!record) return { ok: false, error: 'Fetch this semester first.' };
  const previous = saved.find((r) => r.semester === params.semester - 1);

  let rank: string | null = null;
  if (params.showRank) {
    const standing = await getStanding(user, record);
    if (standing?.topPercent) rank = `Top ${standing.topPercent}% in ${user.branchCode} ${user.graduatingBatch}`;
  }

  const data: ShareCardData = {
    semester: record.semester,
    session: record.payload?.session ?? null,
    sgpa: record.sgpa,
    cgpa: params.showCgpa ? record.cgpa : null,
    previousCgpa: params.showCgpa ? (previous?.cgpa ?? null) : null,
    name: user.name,
    line: [user.branchCode && user.graduatingBatch ? `${user.branchCode} ${user.graduatingBatch}` : null, user.college?.shortName ?? user.college?.name]
      .filter(Boolean)
      .join(' · '),
    rank,
    verified: true,
  };
  const token = await createShareCard({
    userId: user.id,
    enrollment: user.enrollmentNumber,
    semester: params.semester,
    showName: true,
    showCgpa: params.showCgpa,
    showRank: Boolean(rank),
    data,
  });
  return { ok: true, token, url: `${appUrl()}/s/${token}` };
}

/**
 * A share card from a public lookup: no name, masked enrollment, numbers only.
 * Built from the cache, so it never triggers a portal fetch.
 */
export async function sharePublicResult(params: { enrollment: string; semester: number }): Promise<ShareResult> {
  const parsed = parseEnrollment(params.enrollment);
  if (!parsed) return { ok: false, error: 'That enrollment number is not valid.' };
  const cached = await prisma.resultCache.findUnique({
    where: { enrollment_semester: { enrollment: parsed.raw, semester: params.semester } },
  });
  if (!cached?.found) return { ok: false, error: 'Check the result first.' };

  const data: ShareCardData = {
    semester: params.semester,
    session: semesterSchedule(params.semester, parsed.admissionYear).examWindow.replace(/^\w+ to /, ''),
    sgpa: cached.sgpa,
    cgpa: cached.cgpa,
    previousCgpa: null,
    name: null,
    line: maskEnrollment(parsed.raw),
    rank: null,
    verified: false,
  };
  const token = await createShareCard({
    userId: null,
    enrollment: parsed.raw,
    semester: params.semester,
    showName: false,
    showCgpa: true,
    showRank: false,
    data,
  });
  return { ok: true, token, url: `${appUrl()}/s/${token}` };
}

/**
 * "Save to My results" from a lookup. Signed out: go and join with the number
 * pre-filled. Signed in and verified as this number: save it now.
 */
export async function saveLookup(enrollment: string, semester: number): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/onboarding?enrollment=${enrollment}&semester=${semester}`)}`);
  }
  if (!isVerified(user)) redirect(`/onboarding?enrollment=${enrollment}&semester=${semester}`);
  if (user.enrollmentNumber !== enrollment) {
    return { ok: false, error: 'You can only save results for your own enrollment number.' };
  }
  const outcome = await syncSemester(semester);
  if (outcome.kind !== 'saved') return { ok: false, error: 'Could not save this semester. Try again.' };
  return { ok: true };
}
