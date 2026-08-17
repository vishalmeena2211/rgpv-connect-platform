'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { cn } from '@/lib/utils';

const OPTIONS = [
  { value: '', label: 'All' },
  { value: 'BOOKS', label: 'Books' },
  { value: 'ELECTRONICS', label: 'Electronics' },
  { value: 'NOTES', label: 'Notes' },
  { value: 'HOSTEL', label: 'Hostel' },
  { value: 'OTHER', label: 'Other' },
] as const;

/** Category pill filter for the marketplace; writes `?category=`. */
export function CategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get('category') ?? '';

  function select(value: string) {
    const params = new URLSearchParams(searchParams);
    if (value) params.set('category', value);
    else params.delete('category');
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => select(option.value)}
          className={cn(
            'rounded-full border px-3 py-1 text-sm font-medium transition-colors',
            current === option.value
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-input text-muted-foreground hover:bg-accent',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
