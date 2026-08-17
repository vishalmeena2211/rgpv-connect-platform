import { type ListingCategory } from '@rgpv/shared';
import { prisma } from '@rgpv/db';

/** A marketplace listing flattened with its seller for display. */
export interface ListingItem {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  category: ListingCategory;
  imageUrl: string | null;
  isSold: boolean;
  createdAt: string;
  seller: { id: string; name: string };
}

/**
 * List active campus marketplace items. Defaults to the viewer's college so
 * students transact locally; falls back to all listings when the viewer has no
 * college. Optionally filtered by category.
 */
export async function getListings(
  collegeId: string | null,
  category?: ListingCategory,
): Promise<ListingItem[]> {
  const listings = await prisma.marketListing.findMany({
    where: {
      status: 'ACTIVE',
      ...(collegeId ? { collegeId } : {}),
      ...(category ? { category } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 60,
    select: {
      id: true,
      title: true,
      description: true,
      priceCents: true,
      category: true,
      imageUrl: true,
      status: true,
      createdAt: true,
      seller: { select: { id: true, name: true } },
    },
  });

  return listings.map((listing) => ({
    id: listing.id,
    title: listing.title,
    description: listing.description,
    priceCents: listing.priceCents,
    category: listing.category,
    imageUrl: listing.imageUrl,
    isSold: listing.status === 'SOLD',
    createdAt: listing.createdAt.toISOString(),
    seller: listing.seller,
  }));
}
