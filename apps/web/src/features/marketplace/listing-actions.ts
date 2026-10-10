'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@rgpv/db';
import { z } from 'zod';

import { rateLimit } from '@/lib/rate-limit';
import { getCurrentUser, isVerified } from '@/lib/session';
import { publicUrl, storedSize } from '@/lib/storage';

export type ListingActionResult = { ok: true; id?: string } | { ok: false; error: string };

/** Price is entered in rupees and stored as integer paise to avoid float drift. */
const listingSchema = z.object({
  title: z.string().trim().min(3, 'Name the item.').max(120),
  description: z.string().trim().min(5, 'Say what condition it is in.').max(2000),
  priceRupees: z.coerce.number().int('Whole rupees only.').min(0).max(1_000_000),
  category: z.enum(['BOOKS', 'ELECTRONICS', 'NOTES', 'HOSTEL', 'OTHER']),
  pickup: z.string().trim().max(60).optional(),
  imageKey: z.string().optional(),
});

/** List an item at your college. Verified students only; free, no payments. */
export async function createListing(input: z.input<typeof listingSchema>): Promise<ListingActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Sign in first.' };
  if (!isVerified(user)) return { ok: false, error: 'Verify your enrollment to sell.' };
  const parsed = listingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the form.' };
  const limit = await rateLimit(`listing:${user.id}`, 10, 86_400);
  if (!limit.ok) return { ok: false, error: 'You have listed a lot today. Try again tomorrow.' };

  const { priceRupees, imageKey, pickup, ...rest } = parsed.data;
  let imageUrl: string | null = null;
  if (imageKey) {
    if (!imageKey.startsWith(`resources/${user.id}/`) || !(await storedSize(imageKey))) return { ok: false, error: 'Upload the photo again.' };
    imageUrl = publicUrl(imageKey);
  }
  const listing = await prisma.marketListing.create({
    data: { ...rest, pickup: pickup || null, priceCents: priceRupees * 100, imageUrl, sellerId: user.id, collegeId: user.collegeId },
  });
  revalidatePath('/market');
  return { ok: true, id: listing.id };
}

/** Mark sold. Only the seller (or an admin). It greys out for a week, then hides. */
export async function markListingSold(listingId: string): Promise<ListingActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Sign in first.' };
  const listing = await prisma.marketListing.findUnique({ where: { id: listingId }, select: { sellerId: true } });
  if (!listing) return { ok: false, error: 'Listing not found.' };
  if (listing.sellerId !== user.id && user.role !== 'ADMIN') return { ok: false, error: 'Only the seller can mark this sold.' };
  await prisma.marketListing.update({ where: { id: listingId }, data: { status: 'SOLD', soldAt: new Date() } });
  revalidatePath('/market');
  revalidatePath(`/market/${listingId}`);
  return { ok: true };
}

const reportSchema = z.object({
  reason: z.enum(['OFF_TOPIC', 'SPAM', 'HARASSMENT', 'PERSONAL_INFO', 'OTHER']),
  note: z.string().trim().max(500).optional(),
});

export async function reportListing(listingId: string, input: z.input<typeof reportSchema>): Promise<ListingActionResult> {
  const user = await getCurrentUser();
  if (!user || !isVerified(user)) return { ok: false, error: 'Verify your enrollment to report.' };
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Pick a reason.' };
  const listing = await prisma.marketListing.findUnique({ where: { id: listingId }, select: { sellerId: true } });
  if (!listing) return { ok: false, error: 'That listing is gone.' };
  if (listing.sellerId === user.id) return { ok: false, error: 'You cannot report your own listing.' };
  await prisma.report.upsert({
    where: { reporterId_listingId: { reporterId: user.id, listingId } },
    create: { reporterId: user.id, listingId, reason: parsed.data.reason, note: parsed.data.note || null },
    update: { reason: parsed.data.reason, note: parsed.data.note || null },
  });
  return { ok: true };
}
