'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import { createJob } from './job-actions';

const FIELD =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

/** Recruiter form for posting a new job opening; redirects to /jobs on success. */
export function JobForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isRemote, setIsRemote] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = {
      title: String(form.get('title') ?? ''),
      company: String(form.get('company') ?? ''),
      location: String(form.get('location') ?? '') || undefined,
      type: String(form.get('type') ?? 'FULL_TIME'),
      description: String(form.get('description') ?? ''),
      applyUrl: String(form.get('applyUrl') ?? ''),
      isRemote,
    };

    startTransition(async () => {
      const result = await createJob(input);
      if (result.ok) {
        toast.success('Job posted.');
        router.push('/jobs');
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
              Job title
            </label>
            <Input id="title" name="title" required placeholder="Frontend Engineer" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="company" className="text-sm font-medium">
                Company
              </label>
              <Input id="company" name="company" required placeholder="Acme Inc." />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="type" className="text-sm font-medium">
                Type
              </label>
              <select id="type" name="type" className={FIELD} defaultValue="FULL_TIME">
                <option value="FULL_TIME">Full-time</option>
                <option value="INTERNSHIP">Internship</option>
                <option value="PART_TIME">Part-time</option>
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="location" className="text-sm font-medium">
                Location
              </label>
              <Input id="location" name="location" placeholder="Bhopal" disabled={isRemote} />
            </div>
            <label className="flex items-end gap-2 pb-2.5 text-sm">
              <input
                type="checkbox"
                checked={isRemote}
                onChange={(e) => setIsRemote(e.target.checked)}
                className="size-4 rounded border-input"
              />
              Remote
            </label>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="applyUrl" className="text-sm font-medium">
              Application URL
            </label>
            <Input id="applyUrl" name="applyUrl" type="url" required placeholder="https://…" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={6}
              placeholder="Role, responsibilities, requirements…"
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Posting…' : 'Post job'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
