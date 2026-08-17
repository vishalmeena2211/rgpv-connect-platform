'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import { createListing } from './listing-actions';

const FIELD =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

/** Seller form for creating a marketplace listing; redirects on success. */
export function ListingForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = {
      title: String(form.get('title') ?? ''),
      description: String(form.get('description') ?? ''),
      priceRupees: String(form.get('priceRupees') ?? ''),
      category: String(form.get('category') ?? 'OTHER'),
      imageUrl: String(form.get('imageUrl') ?? ''),
    };

    startTransition(async () => {
      const result = await createListing(input);
      if (result.ok) {
        toast.success('Listed.');
        router.push('/market');
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <Input id="title" name="title" required placeholder="Engineering Mathematics textbook" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="priceRupees" className="text-sm font-medium">
                Price (₹)
              </label>
              <Input
                id="priceRupees"
                name="priceRupees"
                type="number"
                min={0}
                required
                placeholder="500"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="category" className="text-sm font-medium">
                Category
              </label>
              <select id="category" name="category" className={FIELD} defaultValue="BOOKS">
                <option value="BOOKS">Books</option>
                <option value="ELECTRONICS">Electronics</option>
                <option value="NOTES">Notes</option>
                <option value="HOSTEL">Hostel</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="imageUrl" className="text-sm font-medium">
              Image URL <span className="text-muted-foreground">(optional)</span>
            </label>
            <Input id="imageUrl" name="imageUrl" type="url" placeholder="https://…" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={5}
              placeholder="Condition, edition, why you're selling…"
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Listing…' : 'List item'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
