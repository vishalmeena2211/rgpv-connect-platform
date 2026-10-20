'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { startUpload } from '@/features/resources/actions';
import { uploadFile } from '@/lib/upload-client';

import { createListing } from './listing-actions';

export function ListingForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);

  function submit(form: FormData) {
    setError(null);
    startTransition(async () => {
      let imageKey: string | undefined;
      if (photo) {
        const start = await startUpload({ contentType: photo.type, size: photo.size });
        if (!start.ok) return setError(start.error);
        try {
          await uploadFile(start.target, photo);
        } catch {
          return setError('The photo did not upload. Try again.');
        }
        imageKey = start.target.key;
      }
      const result = await createListing({
        title: String(form.get('title') ?? ''),
        description: String(form.get('description') ?? ''),
        priceRupees: Number(form.get('price') ?? 0),
        category: form.get('category') as 'BOOKS',
        pickup: String(form.get('pickup') ?? ''),
        imageKey,
      });
      if (!result.ok) return setError(result.error);
      toast.success('Listed.');
      router.push(result.id ? `/market/${result.id}` : '/market');
    });
  }

  return (
    <form action={submit} className="flex flex-col gap-4">
      <Field label="What are you selling?" htmlFor="title"><Input id="title" name="title" required maxLength={120} placeholder="Operating Systems (Galvin), 9th ed." /></Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Price (₹)" htmlFor="price"><Input id="price" name="price" inputMode="numeric" required placeholder="400" className="tabular" /></Field>
        <Field label="Category" htmlFor="category">
          <Select
            id="category"
            name="category"
            defaultValue="BOOKS"
            options={[
              { value: 'BOOKS', label: 'Books' },
              { value: 'ELECTRONICS', label: 'Electronics' },
              { value: 'HOSTEL', label: 'Hostel' },
              { value: 'NOTES', label: 'Notes' },
              { value: 'OTHER', label: 'Other' },
            ]}
          />
        </Field>
        <Field label="Pick up from" htmlFor="pickup"><Input id="pickup" name="pickup" maxLength={60} placeholder="Hostel 4" /></Field>
      </div>
      <Field label="Condition and details" htmlFor="description"><Textarea id="description" name="description" required maxLength={2000} placeholder="Good condition, a few pencil marks." /></Field>
      <Field label="Photo (optional)" htmlFor="photo">
        <label htmlFor="photo" className="flex h-20 cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-dashed border-input bg-subtle text-[13px] text-muted-foreground hover:border-primary">
          <ImageIcon className="size-4" />
          {photo ? photo.name : 'Choose a JPG or PNG'}
        </label>
        <input id="photo" type="file" accept="image/jpeg,image/png" className="sr-only" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
      </Field>
      <p className="text-xs text-muted-foreground">Buyers message you; you meet on campus. RGPV Connect never takes payment or a cut.</p>
      {error ? <p className="text-[13px] text-destructive" role="alert">{error}</p> : null}
      <Button type="submit" className="self-start" disabled={pending}>{pending ? <Loader2 className="animate-spin" /> : null}List it</Button>
    </form>
  );
}
