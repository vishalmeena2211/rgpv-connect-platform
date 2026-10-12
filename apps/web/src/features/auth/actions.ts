'use server';

import { AuthError } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { type Prisma, prisma } from '@rgpv/db';
import { parseEnrollment } from '@rgpv/shared';
import { z } from 'zod';

import { auth, signIn, signOut } from '@/auth';
import { lookupResult } from '@/features/results/service';
import { rateLimit } from '@/lib/rate-limit';
import { maskEnrollment, titleCase } from '@/lib/utils';

/** Only same-site paths are allowed as a post-sign-in destination. */
function safeCallback(value: FormDataEntryValue | null): string {
  const path = typeof value === 'string' ? value : '';
  return path.startsWith('/') && !path.startsWith('//') ? path : '/onboarding';
}

export type SignInState = { error?: string } | undefined;

/** Send a one-time sign-in link to an email address. */
export async function emailSignIn(_: SignInState, formData: FormData): Promise<SignInState> {
  const email = z.string().trim().toLowerCase().email().safeParse(formData.get('email'));
  if (!email.success) return { error: 'Enter an email address like name@gmail.com.' };

  const limited = await rateLimit(`signin:${email.data}`, 5, 3600);
  if (!limited.ok) return { error: 'Too many links sent to this address. Try again in an hour.' };

  try {
    await signIn('email', { email: email.data, redirectTo: safeCallback(formData.get('callbackUrl')) });
  } catch (error) {
    if (error instanceof AuthError) return { error: 'We could not send the link. Try again in a minute.' };
    throw error; // the redirect to "check your email"
  }
  return undefined;
}

export async function googleSignIn(formData: FormData): Promise<void> {
  await signIn('google', { redirectTo: safeCallback(formData.get('callbackUrl')) });
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: '/' });
}

/** Result of the "find my result" step of enrollment verification. */
export type EnrollmentPreview =
  | {
      ok: true;
      enrollment: string;
      semester: number;
      name: string;
      collegeCode: string;
      collegeName: string;
      branchName: string;
      admissionYear: number;
      graduatingBatch: number;
      sgpa: number | null;
      status: string;
      session: string | null;
    }
  | { ok: false; error: string; takenBy?: { verifiedOn: string; via: string } };

async function collegeName(code: string): Promise<string> {
  const college = await prisma.college.findUnique({ where: { code }, select: { name: true, shortName: true } });
  return college?.shortName ? `${college.shortName}, Bhopal` : (college?.name ?? `College ${code}`);
}

/**
 * Step 1: fetch the student's result to prove the number is theirs, and decode
 * college / branch / batch from the number. Nothing is saved yet.
 */
export async function previewEnrollment(enrollmentInput: string, semester: number): Promise<EnrollmentPreview> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: 'Sign in first.' };

  const parsed = parseEnrollment(enrollmentInput);
  if (!parsed) return { ok: false, error: 'That does not look like an RGPV enrollment number. It looks like 0151CS241042.' };

  const holder = await prisma.user.findUnique({
    where: { enrollmentNumber: parsed.raw },
    select: { id: true, verifiedAt: true, createdAt: true, accounts: { select: { provider: true } } },
  });
  if (holder && holder.id !== session.user.id) {
    return {
      ok: false,
      error: 'This number is already linked to another account.',
      takenBy: {
        verifiedOn: (holder.verifiedAt ?? holder.createdAt).toISOString(),
        via: holder.accounts.some((a) => a.provider === 'google') ? 'Google' : 'an email link',
      },
    };
  }

  const outcome = await lookupResult(parsed.raw, semester, { limitKey: `verify:${session.user.id}` });
  if (outcome.kind === 'not_declared') {
    return { ok: false, error: `RGPV has no semester ${semester} result for this number. Pick a semester you already have a result for.` };
  }
  if (outcome.kind === 'rate_limited') return { ok: false, error: 'Too many tries. Wait a few minutes and try again.' };
  if (outcome.kind === 'unavailable') {
    return {
      ok: false,
      error:
        outcome.cause === 'portal'
          ? 'RGPV’s result portal is not answering right now. Try again in a few minutes.'
          : 'We can’t check results right now because of a problem on our side, not with your number. Try again in a few minutes.',
    };
  }

  const result = outcome.result;
  return {
    ok: true,
    enrollment: parsed.raw,
    semester,
    name: titleCase(result.name),
    collegeCode: parsed.collegeCode,
    collegeName: await collegeName(parsed.collegeCode),
    branchName: parsed.branchName,
    admissionYear: parsed.admissionYear,
    graduatingBatch: parsed.graduatingBatch,
    sgpa: result.sgpa ?? null,
    status: result.status,
    session: result.session ?? null,
  };
}

/** Join (creating if needed) the college group and the branch + batch cohort. */
async function joinAutoGroups(tx: Prisma.TransactionClient, userId: string, college: { id: string; code: string; name: string; shortName: string | null }, branchCode: string, batch: number) {
  const collegeGroup = await tx.group.upsert({
    where: { slug: `college:${college.code}` },
    update: {},
    create: { slug: `college:${college.code}`, name: college.shortName ? `${college.shortName}, Bhopal` : college.name, type: 'COLLEGE', collegeId: college.id },
  });
  const cohort = await tx.group.upsert({
    where: { slug: `cohort:${college.code}:${branchCode}:${batch}` },
    update: {},
    create: {
      slug: `cohort:${college.code}:${branchCode}:${batch}`,
      name: `${branchCode} ${batch} · ${college.shortName ?? college.name}`,
      type: 'BRANCH',
      collegeId: college.id,
      branchCode,
      graduatingBatch: batch,
    },
  });
  for (const groupId of [collegeGroup.id, cohort.id]) {
    await tx.groupMember.upsert({
      where: { groupId_userId: { groupId, userId } },
      update: {},
      create: { groupId, userId },
    });
  }
}

/**
 * Step 2: bind the confirmed enrollment to the account. The name comes from
 * RGPV, the grouping from the number, and the previewed semester is saved.
 */
export async function confirmEnrollment(enrollmentInput: string, semester: number): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: 'Sign in first.' };
  const userId = session.user.id;

  const parsed = parseEnrollment(enrollmentInput);
  if (!parsed) return { ok: false, error: 'Invalid enrollment number.' };

  // Only confirm a result we actually fetched in step 1 (it is in the cache).
  const cached = await prisma.resultCache.findUnique({
    where: { enrollment_semester: { enrollment: parsed.raw, semester } },
  });
  if (!cached?.found || !cached.payload) return { ok: false, error: 'Find your result first.' };
  const name = titleCase(String((cached.payload as { name?: string }).name ?? ''));

  try {
    await prisma.$transaction(async (tx) => {
      const holder = await tx.user.findUnique({ where: { enrollmentNumber: parsed.raw }, select: { id: true } });
      if (holder && holder.id !== userId) throw new Error('TAKEN');

      const college = await tx.college.upsert({
        where: { code: parsed.collegeCode },
        update: {},
        create: { code: parsed.collegeCode, name: `College ${parsed.collegeCode}`, city: 'Bhopal' },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          ...(name ? { name } : {}),
          enrollmentNumber: parsed.raw,
          verificationStatus: 'VERIFIED',
          verifiedAt: new Date(),
          collegeId: college.id,
          branchCode: parsed.branchCode,
          admissionYear: parsed.admissionYear,
          graduatingBatch: parsed.graduatingBatch,
        },
      });

      await tx.resultRecord.upsert({
        where: { userId_semester: { userId, semester } },
        create: { userId, semester, status: cached.status ?? 'UNKNOWN', sgpa: cached.sgpa, cgpa: cached.cgpa, payload: cached.payload as Prisma.InputJsonValue },
        update: { status: cached.status ?? 'UNKNOWN', sgpa: cached.sgpa, cgpa: cached.cgpa, payload: cached.payload as Prisma.InputJsonValue },
      });

      await joinAutoGroups(tx, userId, college, parsed.branchCode, parsed.graduatingBatch);
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'TAKEN') {
      return { ok: false, error: 'This enrollment was linked to another account a moment ago.' };
    }
    throw error;
  }

  revalidatePath('/', 'layout');
  return { ok: true };
}

/**
 * "This is my number, someone else used it." Files a claim for the admins.
 * Until it is decided both accounts show "Verification under review".
 */
export async function disputeEnrollment(enrollmentInput: string, note: string): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: 'Sign in first.' };
  const parsed = parseEnrollment(enrollmentInput);
  if (!parsed) return { ok: false, error: 'Invalid enrollment number.' };

  const holder = await prisma.user.findUnique({ where: { enrollmentNumber: parsed.raw }, select: { id: true } });
  if (!holder || holder.id === session.user.id) return { ok: false, error: 'This number is not linked to anyone else.' };

  const open = await prisma.identityDispute.findFirst({
    where: { enrollmentNumber: parsed.raw, claimantId: session.user.id, status: 'OPEN' },
  });
  if (!open) {
    await prisma.identityDispute.create({
      data: { enrollmentNumber: parsed.raw, claimantId: session.user.id, holderId: holder.id, note: note.trim().slice(0, 1000) || null },
    });
  }
  redirect(`/onboarding?claimed=${encodeURIComponent(maskEnrollment(parsed.raw))}`);
}
