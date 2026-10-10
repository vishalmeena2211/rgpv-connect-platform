import 'server-only';

import { type ListingCategory, prisma } from '@rgpv/db';

export interface ListingItem {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  category: ListingCategory;
  imageUrl: string | null;
  pickup: string | null;
  isSold: boolean;
  createdAt: string;
  seller: { id: string; name: string };
}

/** Active listings at the viewer's college, plus those sold in the last week (greyed). */
export async function getListings(collegeId: string | null, category?: ListingCategory): Promise<ListingItem[]> {
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const listings = await prisma.marketListing.findMany({
    where: {
      ...(collegeId ? { collegeId } : {}),
      ...(category ? { category } : {}),
      OR: [{ status: 'ACTIVE' }, { status: 'SOLD', soldAt: { gt: weekAgo } }],
    },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 60,
    select: { id: true, title: true, description: true, priceCents: true, category: true, imageUrl: true, pickup: true, status: true, createdAt: true, seller: { select: { id: true, name: true } } },
  });
  return listings.map((l) => ({ ...l, isSold: l.status === 'SOLD', createdAt: l.createdAt.toISOString() }));
}

/** One listing with the seller's trust line: verified, time here, items sold. */
export async function getListing(id: string) {
  const listing = await prisma.marketListing.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      priceCents: true,
      category: true,
      imageUrl: true,
      pickup: true,
      status: true,
      createdAt: true,
      seller: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          branchCode: true,
          graduatingBatch: true,
          verificationStatus: true,
          createdAt: true,
          college: { select: { shortName: true } },
          _count: { select: { listings: { where: { status: 'SOLD' } } } },
        },
      },
    },
  });
  return listing;
}
