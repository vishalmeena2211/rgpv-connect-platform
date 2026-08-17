import { prisma } from '@rgpv/db';

import { type FeedPost } from './feed-queries';

/** Full profile view-model: identity, grouping, counts, and recent posts. */
export interface Profile {
  id: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  branchCode: string | null;
  graduatingBatch: number | null;
  collegeName: string | null;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  isSelf: boolean;
  posts: FeedPost[];
}

/**
 * Load a public profile by user id, computed relative to the viewer (follow
 * state + whether it's their own profile). Returns null for unknown ids.
 */
export async function getProfile(userId: string, viewerId: string | null): Promise<Profile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      bio: true,
      branchCode: true,
      graduatingBatch: true,
      college: { select: { name: true } },
      _count: { select: { followers: true, following: true } },
      followers: viewerId
        ? { where: { followerId: viewerId }, select: { id: true } }
        : false,
      posts: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          body: true,
          imageUrl: true,
          scope: true,
          likeCount: true,
          createdAt: true,
          _count: { select: { comments: true } },
        },
      },
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    branchCode: user.branchCode,
    graduatingBatch: user.graduatingBatch,
    collegeName: user.college?.name ?? null,
    followerCount: user._count.followers,
    followingCount: user._count.following,
    isFollowing: Array.isArray(user.followers) && user.followers.length > 0,
    isSelf: viewerId === user.id,
    posts: user.posts.map((post) => ({
      id: post.id,
      body: post.body,
      imageUrl: post.imageUrl,
      scope: post.scope,
      likeCount: post.likeCount,
      commentCount: post._count.comments,
      createdAt: post.createdAt.toISOString(),
      author: {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        branchCode: user.branchCode,
        graduatingBatch: user.graduatingBatch,
      },
    })),
  };
}
