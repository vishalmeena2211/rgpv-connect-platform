'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@rgpv/db';

import { getCurrentUser, isVerified } from '@/lib/session';

/** Result of a listing mutation. */
export type ListingActionResult = { ok: true } | { ok: false; error: string };

/** Validates seller-submitted listing fields. Price is entered in rupees and
 * stored as integer paise to avoid floating-point drift. */
const listingSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(5).max(2000),
  priceRupees: z.coerce.number().int().min(0).max(1_000_000),
  category: z.enum(['BOOKS', 'ELECTRONICS', 'NOTES', 'HOSTEL', 'OTHER']),
  imageUrl: z.string().trim().url().optional().or(z.literal('')),
});

/**
 * Create a campus marketplace listing for the signed-in verified user, scoped
 * to their college so it surfaces to local buyers.
 */
export async function createListing(input: unknown): Promise<ListingActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'You must be signed in.' };
  if (!isVerified(user)) return { ok: false, error: 'Verify your enrollment to sell.' };

  const parsed = listingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid listing details.' };
  }

  const { priceRupees, imageUrl, ...rest } = parsed.data;
  await prisma.marketListing.create({
    data: {
      ...rest,
      priceCents: priceRupees * 100,
      imageUrl: imageUrl || null,
      sellerId: user.id,
      collegeId: user.collegeId,
    },
  });

  revalidatePath('/market');
  return { ok: true };
}

/** Mark a listing sold. Only the seller (or an admin) may do this. */
export async function markListingSold(listingId: string): Promise<ListingActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'You must be signed in.' };

  const listing = await prisma.marketListing.findUnique({
    where: { id: listingId },
    select: { sellerId: true },
  });
  if (!listing) return { ok: false, error: 'Listing not found.' };
  if (listing.sellerId !== user.id && user.role !== 'ADMIN') {
    return { ok: false, error: 'Only the seller can mark this sold.' };
  }

  await prisma.marketListing.update({
    where: { id: listingId },
    data: { status: 'SOLD' },
  });

  revalidatePath('/market');
  return { ok: true };
}
