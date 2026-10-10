import 'server-only';

import { type Prisma, prisma } from '@rgpv/db';

/** A feed post flattened with its author for rendering. */
export interface FeedPost {
  id: string;
  body: string;
  imageUrl: string | null;
  likeCount: number;
  commentCount: number;
  likedByViewer: boolean;
  createdAt: string;
  hidden: boolean;
  groupName: string | null;
  author: {
    id: string;
    name: string;
    avatarUrl: string | null;
    branchCode: string | null;
    graduatingBatch: number | null;
    verified: boolean;
    collegeShortName: string | null;
  };
}

export function postSelect(viewerId: string | null) {
  return {
    id: true,
    body: true,
    imageUrl: true,
    likeCount: true,
    createdAt: true,
    hiddenAt: true,
    group: { select: { name: true } },
    _count: { select: { comments: true } },
    likes: viewerId ? { where: { userId: viewerId }, select: { userId: true } } : false,
    author: {
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        branchCode: true,
        graduatingBatch: true,
        verificationStatus: true,
        college: { select: { shortName: true } },
      },
    },
  } satisfies Prisma.PostSelect;
}

type PostRow = Prisma.PostGetPayload<{ select: ReturnType<typeof postSelect> }>;

export function toFeedPost(post: PostRow): FeedPost {
  return {
    id: post.id,
    body: post.body,
    imageUrl: post.imageUrl,
    likeCount: post.likeCount,
    commentCount: post._count.comments,
    likedByViewer: Array.isArray(post.likes) && post.likes.length > 0,
    createdAt: post.createdAt.toISOString(),
    hidden: post.hiddenAt !== null,
    groupName: post.group?.name ?? null,
    author: {
      id: post.author.id,
      name: post.author.name,
      avatarUrl: post.author.avatarUrl,
      branchCode: post.author.branchCode,
      graduatingBatch: post.author.graduatingBatch,
      verified: post.author.verificationStatus === 'VERIFIED',
      collegeShortName: post.author.college?.shortName ?? null,
    },
  };
}

/**
 * The college feed (strategy doc: college scope only; university scope never
 * reaches density). `groupId` narrows to one cohort. Hidden posts show only to
 * their author, with a note; removed posts never show.
 */
export async function getFeed(viewer: { id: string; collegeId: string | null }, groupId?: string): Promise<FeedPost[]> {
  if (!viewer.collegeId) return [];
  const posts = await prisma.post.findMany({
    where: {
      removedAt: null,
      OR: [{ hiddenAt: null }, { authorId: viewer.id }],
      ...(groupId ? { groupId } : { collegeId: viewer.collegeId }),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: postSelect(viewer.id),
  });
  return posts.map(toFeedPost);
}
