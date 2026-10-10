import 'server-only';

import { prisma } from '@rgpv/db';

import { type FeedPost, toFeedPost, postSelect } from './feed-queries';

/** Full profile view-model: identity, grouping, counts, contributions. */
export interface Profile {
  id: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  branchCode: string | null;
  graduatingBatch: number | null;
  admissionYear: number | null;
  collegeName: string | null;
  verified: boolean;
  underReview: boolean;
  followerCount: number;
  followingCount: number;
  notesShared: number;
  isFollowing: boolean;
  isSelf: boolean;
  notes: { id: string; title: string; subjectCode: string | null; rating: number; ratingCount: number; downloadCount: number }[];
  posts: FeedPost[];
  groups: { id: string; name: string; members: number }[];
}

export async function getProfile(userId: string, viewerId: string | null): Promise<Profile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      bio: true,
      role: true,
      branchCode: true,
      graduatingBatch: true,
      admissionYear: true,
      verificationStatus: true,
      college: { select: { name: true, shortName: true } },
      _count: { select: { followers: true, following: true, resources: { where: { status: 'APPROVED' } } } },
      followers: viewerId ? { where: { followerId: viewerId }, select: { id: true } } : false,
      resources: {
        where: { status: 'APPROVED' },
        orderBy: [{ downloadCount: 'desc' }],
        take: 20,
        select: { id: true, title: true, rating: true, ratingCount: true, downloadCount: true, subject: { select: { code: true } } },
      },
      posts: {
        where: { hiddenAt: null, removedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: postSelect(viewerId),
      },
      groupMemberships: { select: { group: { select: { id: true, name: true, _count: { select: { members: true } } } } } },
      disputesAgainst: { where: { status: 'OPEN' }, select: { id: true }, take: 1 },
      disputesFiled: { where: { status: 'OPEN' }, select: { id: true }, take: 1 },
    },
  });
  if (!user || user.role === 'ADMIN') return null;

  return {
    id: user.id,
    name: user.name,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    branchCode: user.branchCode,
    graduatingBatch: user.graduatingBatch,
    admissionYear: user.admissionYear,
    collegeName: user.college?.shortName ? `${user.college.shortName}, Bhopal` : (user.college?.name ?? null),
    verified: user.verificationStatus === 'VERIFIED',
    underReview: user.disputesAgainst.length > 0 || user.disputesFiled.length > 0,
    followerCount: user._count.followers,
    followingCount: user._count.following,
    notesShared: user._count.resources,
    isFollowing: Array.isArray(user.followers) && user.followers.length > 0,
    isSelf: viewerId === user.id,
    notes: user.resources.map((r) => ({ id: r.id, title: r.title, subjectCode: r.subject.code, rating: r.rating, ratingCount: r.ratingCount, downloadCount: r.downloadCount })),
    posts: user.posts.map((post) => toFeedPost(post)),
    groups: user.groupMemberships.map((m) => ({ id: m.group.id, name: m.group.name, members: m.group._count.members })),
  };
}
