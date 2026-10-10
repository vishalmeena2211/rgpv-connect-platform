import type { Metadata } from 'next';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { prisma } from '@rgpv/db';

import { FeatureClosed } from '@/components/feature-closed';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChipLink, ChipRow } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Composer } from '@/features/network/composer';
import { getFeed } from '@/features/network/feed-queries';
import { PostCard } from '@/features/network/post-card';
import { isFeatureOpen } from '@/lib/features';
import { isVerified, requireUser } from '@/lib/session';

export const metadata: Metadata = { title: 'Home' };

/** College feed; only verified students post. A chip narrows it to your batch. */
export default async function FeedPage({ searchParams }: { searchParams: Promise<{ group?: string }> }) {
  const user = await requireUser('/feed');
  if (!isFeatureOpen('network', user.role)) return <FeatureClosed feature="network" />;
  if (!isVerified(user) || !user.collegeId) {
    return (
      <Card className="mx-auto max-w-[680px]">
        <EmptyState icon={MessageCircle} title="Verify to see your college" action={<Button asChild><Link href="/onboarding">Verify enrollment</Link></Button>}>
          The feed is scoped to your college, which comes from your enrollment number.
        </EmptyState>
      </Card>
    );
  }
  const { group } = await searchParams;
  const cohort = await prisma.group.findFirst({
    where: { members: { some: { userId: user.id } }, branchCode: user.branchCode, graduatingBatch: user.graduatingBatch },
    select: { id: true, name: true },
  });
  const groupId = group && cohort && group === cohort.id ? cohort.id : undefined;
  const posts = await getFeed(user, groupId);
  const collegeLabel = user.college?.shortName ?? 'My college';
  const cohortLabel = user.branchCode && user.graduatingBatch ? `${user.branchCode} ${user.graduatingBatch}` : null;

  return (
    <div className="mx-auto flex max-w-[680px] flex-col gap-4">
      <PageHeader title="Home" description={`Posts from ${collegeLabel}. Only verified students can post.`} />
      <Composer author={{ name: user.name, avatarUrl: user.avatarUrl }} collegeLabel={collegeLabel} cohort={cohort && cohortLabel ? { id: cohort.id, label: cohortLabel } : null} />
      {cohort ? (
        <ChipRow>
          <ChipLink href="/feed" on={!groupId}>All of {collegeLabel}</ChipLink>
          <ChipLink href={`/feed?group=${cohort.id}`} on={Boolean(groupId)}>{cohortLabel}</ChipLink>
        </ChipRow>
      ) : null}
      {posts.length === 0 ? (
        <Card><EmptyState icon={MessageCircle} title="Nothing posted yet">Ask something your batch would know. The first post sets the tone.</EmptyState></Card>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} viewerId={user.id} />)
      )}
    </div>
  );
}
