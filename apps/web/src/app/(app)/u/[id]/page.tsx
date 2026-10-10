import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, MessageCircle, NotebookText } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChipLink, ChipRow } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { startConversation } from '@/features/messages/actions';
import { FollowButton } from '@/features/network/follow-button';
import { PostCard } from '@/features/network/post-card';
import { getProfile } from '@/features/network/profile-queries';
import { getCurrentUser, isVerified } from '@/lib/session';
import { batchTag, formatCount, initials } from '@/lib/utils';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const profile = await getProfile(id, null);
  return { title: profile?.name ?? 'Profile' };
}

function yearOfStudy(batch: number | null): string | null {
  if (!batch) return null;
  const left = batch - new Date().getFullYear();
  if (left <= 0) return 'graduate';
  return ['final year', 'third year', 'second year', 'first year'][left - 1] ?? null;
}

/** Identity first; then what the person contributed. Grades never appear here. */
export default async function ProfilePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const [{ id }, { tab = 'notes' }, viewer] = await Promise.all([params, searchParams, getCurrentUser()]);
  const profile = await getProfile(id, viewer?.id ?? null);
  if (!profile) notFound();
  const tag = batchTag(profile.branchCode, profile.graduatingBatch);

  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-5">
      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Avatar className="size-16">
            {profile.avatarUrl ? <AvatarImage src={profile.avatarUrl} alt="" /> : null}
            <AvatarFallback className="text-xl">{initials(profile.name)}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-[22px] font-bold tracking-[-0.02em]">{profile.name}</h1>
              {profile.underReview ? (
                <Badge variant="warning"><Clock />Verification under review</Badge>
              ) : profile.verified ? (
                <Badge variant="verified">Verified</Badge>
              ) : (
                <Badge>Not verified</Badge>
              )}
              {tag ? <Badge>{tag}</Badge> : null}
            </div>
            <p className="text-[13px] text-muted-foreground">
              {[profile.collegeName, yearOfStudy(profile.graduatingBatch)].filter(Boolean).join(' · ')}
            </p>
            <dl className="mt-1 flex flex-wrap gap-4 text-[13px]">
              <div><dt className="sr-only">Followers</dt><dd><b className="tabular">{formatCount(profile.followerCount)}</b> <span className="text-muted-foreground">followers</span></dd></div>
              <div><dt className="sr-only">Following</dt><dd><b className="tabular">{formatCount(profile.followingCount)}</b> <span className="text-muted-foreground">following</span></dd></div>
              <div><dt className="sr-only">Notes shared</dt><dd><b className="tabular">{profile.notesShared}</b> <span className="text-muted-foreground">notes shared</span></dd></div>
            </dl>
          </div>
          {profile.isSelf ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/settings">Edit profile</Link>
            </Button>
          ) : viewer ? (
            <div className="flex gap-2">
              <FollowButton targetUserId={profile.id} initialFollowing={profile.isFollowing} />
              {isVerified(viewer) ? (
                <form action={startConversation.bind(null, profile.id)}>
                  <Button type="submit" variant="outline" size="sm">
                    <MessageCircle />
                    Message
                  </Button>
                </form>
              ) : null}
            </div>
          ) : null}
        </div>
        {profile.bio ? <p className="mt-4 text-[13.5px] leading-[21px]">{profile.bio}</p> : null}
        {profile.isSelf ? <p className="mt-3 text-xs text-muted-foreground">Your results are private. Only you see them.</p> : null}
      </Card>

      <ChipRow>
        <ChipLink href={`/u/${profile.id}?tab=notes`} on={tab === 'notes'}>Notes · {profile.notesShared}</ChipLink>
        <ChipLink href={`/u/${profile.id}?tab=posts`} on={tab === 'posts'}>Posts · {profile.posts.length}</ChipLink>
        <ChipLink href={`/u/${profile.id}?tab=groups`} on={tab === 'groups'}>Groups · {profile.groups.length}</ChipLink>
      </ChipRow>

      {tab === 'posts' ? (
        profile.posts.length ? (
          profile.posts.map((post) => <PostCard key={post.id} post={post} viewerId={viewer?.id ?? null} />)
        ) : (
          <Card><EmptyState icon={MessageCircle} title={profile.isSelf ? 'You have not posted yet' : `${profile.name.split(' ')[0]} has not posted yet`} /></Card>
        )
      ) : tab === 'groups' ? (
        <ul className="flex flex-col gap-2">
          {profile.groups.map((g) => (
            <li key={g.id} className="flex items-center justify-between rounded-md border bg-card px-4 py-3 text-[13px] shadow-card">
              <b className="font-display">{g.name}</b>
              <span className="text-xs text-muted-foreground">{g.members} verified</span>
            </li>
          ))}
        </ul>
      ) : profile.notes.length ? (
        <ul className="flex flex-col gap-2">
          {profile.notes.map((note) => (
            <li key={note.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md border bg-card px-4 py-3 shadow-card">
              <span className="grid size-8 place-items-center rounded-full bg-accent"><NotebookText className="size-4 text-accent-foreground" /></span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold">{note.subjectCode} · {note.title}</p>
                <p className="text-xs text-muted-foreground tabular">
                  {note.ratingCount ? `${note.rating.toFixed(1)} (${note.ratingCount}) · ` : ''}
                  {formatCount(note.downloadCount)} downloads
                </p>
              </div>
              <Button asChild size="sm" variant="outline"><Link href={`/resources/${note.id}`}>Open</Link></Button>
            </li>
          ))}
        </ul>
      ) : (
        <Card><EmptyState icon={NotebookText} title={profile.isSelf ? 'You have not shared notes yet' : 'No notes shared yet'} action={profile.isSelf ? <Button asChild><Link href="/uploads">Share notes</Link></Button> : null} /></Card>
      )}
    </div>
  );
}
