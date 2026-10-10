import type { Metadata } from 'next';
import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { prisma } from '@rgpv/db';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { signOutAction } from '@/features/auth/actions';
import { InstallButton } from '@/features/pwa/install-button';
import { EnablePush } from '@/features/push/enable-push';
import { BioForm, DeletionControl, PreferenceRow } from '@/features/settings/settings-client';
import { env } from '@/lib/env';
import { requireUser } from '@/lib/session';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const user = await requireUser('/settings');
  const [prefs, deletion] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { notifyResults: true, notifyMessages: true, notifyReviews: true, notifySocial: true, showOnBoard: true, bio: true },
    }),
    prisma.deletionRequest.findFirst({ where: { userId: user.id, status: 'PENDING' }, select: { eligibleAt: true } }),
  ]);

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-5">
      <PageHeader title="Settings" description={user.email ?? undefined} />

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          {user.verificationStatus === 'VERIFIED' ? <Badge variant="verified">Verified</Badge> : <Badge>Not verified</Badge>}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <dl className="grid grid-cols-[130px_1fr] gap-x-3 gap-y-2 text-[13px]">
            <dt className="text-muted-foreground">Name</dt>
            <dd className="font-medium">{user.name}</dd>
            <dt className="text-muted-foreground">Enrollment</dt>
            <dd className="font-medium tabular">{user.enrollmentNumber ?? <Link href="/onboarding" className="text-accent-foreground">Verify now</Link>}</dd>
            {user.college ? (
              <>
                <dt className="text-muted-foreground">College</dt>
                <dd className="font-medium">{user.college.name}</dd>
              </>
            ) : null}
          </dl>
          <p className="text-xs text-muted-foreground">Your name comes from your RGPV result, so it cannot be edited here.</p>
          <BioForm initial={prefs.bio ?? ''} />
        </CardContent>
      </Card>

      <Card id="notifications" className="scroll-mt-24">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="divide-y">
            <PreferenceRow name="notifyResults" label="A new semester result is declared for my batch" hint="Your result is fetched first, so the notification has your SGPA." initial={prefs.notifyResults} />
            <PreferenceRow name="notifyMessages" label="Someone messages me" initial={prefs.notifyMessages} />
            <PreferenceRow name="notifyReviews" label="My notes are reviewed" initial={prefs.notifyReviews} />
            <PreferenceRow name="notifySocial" label="Likes and follows" initial={prefs.notifySocial} />
          </div>
          <div className="flex flex-wrap items-start justify-between gap-3 rounded-md bg-subtle p-3">
            <p className="max-w-sm text-xs text-muted-foreground">
              These switches choose what reaches your phone. Everything still shows in the app. Nothing is sent by SMS.
            </p>
            <EnablePush vapidPublicKey={env.VAPID_PUBLIC_KEY ?? null} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="divide-y">
            <PreferenceRow
              name="showOnBoard"
              label="Show me on my batch’s semester board"
              hint="Off by default. When on, batchmates see your name with your SGPA and CGPA on the board."
              initial={prefs.showOnBoard}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">Open My results offline and hear first on results day.</p>
            <InstallButton size="sm" variant="outline" />
          </div>
        </CardContent>
      </Card>

      <Card id="privacy" className="scroll-mt-24">
        <CardHeader>
          <CardTitle>Privacy</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-[13px] text-muted-foreground">
            Your grades are private unless you share a card or join the board. Read what we keep in the{' '}
            <Link href="/privacy" className="font-semibold text-accent-foreground">privacy policy</Link>.
          </p>
          <DeletionControl pendingUntil={deletion ? formatDate(deletion.eligibleAt) : null} />
        </CardContent>
      </Card>

      <form action={signOutAction}>
        <Button type="submit" variant="ghost">
          <LogOut />
          Sign out
        </Button>
      </form>
    </div>
  );
}
