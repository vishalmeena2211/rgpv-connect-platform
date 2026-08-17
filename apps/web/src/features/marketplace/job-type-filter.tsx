'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { cn } from '@/lib/utils';

const OPTIONS = [
  { value: '', label: 'All' },
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'INTERNSHIP', label: 'Internships' },
  { value: 'PART_TIME', label: 'Part-time' },
] as const;

/** Employment-type pill filter; writes `?type=` for the server component. */
export function JobTypeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get('type') ?? '';

  function select(value: string) {
    const params = new URLSearchParams(searchParams);
    if (value) params.set('type', value);
    else params.delete('type');
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="inline-flex flex-wrap rounded-lg bg-muted p-1 text-sm">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => select(option.value)}
          className={cn(
            'rounded-md px-3 py-1.5 font-medium transition-colors',
            current === option.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
