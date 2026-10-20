'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { BRANCH_CODES } from '@rgpv/shared';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ChipButton } from '@/components/ui/chip';
import { Field, Input, Textarea } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

import { createJob } from './job-actions';

export function JobForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [branches, setBranches] = useState<string[]>([]);
  const [batches, setBatches] = useState<number[]>([]);
  const year = new Date().getFullYear();
  const batchOptions = [year, year + 1, year + 2, year + 3];

  function submit(form: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createJob({
        title: String(form.get('title') ?? ''),
        company: String(form.get('company') ?? ''),
        location: String(form.get('location') ?? ''),
        type: form.get('type') as 'FULL_TIME' | 'INTERNSHIP' | 'PART_TIME',
        pay: String(form.get('pay') ?? ''),
        description: String(form.get('description') ?? ''),
        applyUrl: String(form.get('applyUrl') ?? ''),
        isRemote: form.get('isRemote') === 'on',
        branches,
        batches,
        closesAt: String(form.get('closesAt') ?? '') || undefined,
      });
      if (!result.ok) return setError(result.error);
      toast.success('Job posted.');
      router.push('/jobs');
    });
  }

  const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  return (
    <form action={submit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Job title" htmlFor="title"><Input id="title" name="title" required maxLength={120} placeholder="Software engineer intern" /></Field>
        <Field label="Company" htmlFor="company"><Input id="company" name="company" required maxLength={120} /></Field>
        <Field label="Type" htmlFor="type">
          <Select
            id="type"
            name="type"
            defaultValue="INTERNSHIP"
            options={[
              { value: 'INTERNSHIP', label: 'Internship' },
              { value: 'FULL_TIME', label: 'Full time' },
              { value: 'PART_TIME', label: 'Part time' },
            ]}
          />
        </Field>
        <Field label="Stipend or salary" htmlFor="pay"><Input id="pay" name="pay" maxLength={60} placeholder="₹15,000 a month or ₹4.2 LPA" /></Field>
        <Field label="Location" htmlFor="location"><Input id="location" name="location" maxLength={120} placeholder="Bhopal" /></Field>
        <Field label="Applications close" htmlFor="closesAt" hint="The job disappears after this date."><Input id="closesAt" name="closesAt" type="date" /></Field>
      </div>
      <Checkbox id="isRemote" name="isRemote" label="Remote" />
      <Field label="Open to branches" hint="Leave all off for any branch.">
        <div className="flex flex-wrap gap-1.5">
          {Object.keys(BRANCH_CODES).map((code) => (
            <ChipButton key={code} on={branches.includes(code)} onClick={() => setBranches((b) => toggle(b, code))}>{code}</ChipButton>
          ))}
        </div>
      </Field>
      <Field label="Open to batches" hint="Leave all off for any batch.">
        <div className="flex flex-wrap gap-1.5">
          {batchOptions.map((b) => (
            <ChipButton key={b} on={batches.includes(b)} onClick={() => setBatches((list) => toggle(list, b))}>{b} batch</ChipButton>
          ))}
        </div>
      </Field>
      <Field label="What the role is" htmlFor="description"><Textarea id="description" name="description" required maxLength={5000} className="min-h-[120px]" /></Field>
      <Field label="Where students apply" htmlFor="applyUrl" hint="Applying happens on your site. RGPV Connect only counts the clicks."><Input id="applyUrl" name="applyUrl" type="url" required placeholder="https://" /></Field>
      {error ? <p className="text-[13px] text-destructive" role="alert">{error}</p> : null}
      <Button type="submit" className="self-start" disabled={pending}>{pending ? <Loader2 className="animate-spin" /> : null}Post job</Button>
    </form>
  );
}
