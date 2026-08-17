import { type PostScope } from '@rgpv/shared';
import { prisma } from '@rgpv/db';

/** A feed post flattened with its author for rendering. */
export interface FeedPost {
  id: string;
  body: string;
  imageUrl: string | null;
  scope: PostScope;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatarUrl: string | null;
    branchCode: string | null;
    graduatingBatch: number | null;
  };
}

/**
 * Load the home feed for a user. Shows university-wide posts plus posts scoped
 * to the user's own college, newest first. Signed-out / unscoped users see the
 * university feed only.
 */
export async function getFeed(collegeId: string | null): Promise<FeedPost[]> {
  const posts = await prisma.post.findMany({
    where: {
      OR: [
        { scope: 'UNIVERSITY' },
        ...(collegeId ? [{ scope: 'COLLEGE' as const, collegeId }] : []),
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      body: true,
      imageUrl: true,
      scope: true,
      likeCount: true,
      createdAt: true,
      _count: { select: { comments: true } },
      author: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          branchCode: true,
          graduatingBatch: true,
        },
      },
    },
  });

  return posts.map((post) => ({
    id: post.id,
    body: post.body,
    imageUrl: post.imageUrl,
    scope: post.scope,
    likeCount: post.likeCount,
    commentCount: post._count.comments,
    createdAt: post.createdAt.toISOString(),
    author: post.author,
  }));
}
