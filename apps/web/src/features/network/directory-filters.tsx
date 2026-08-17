'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const SCOPES = [
  { value: 'college', label: 'My College' },
  { value: 'all', label: 'All RGPV' },
] as const;

/**
 * Directory controls: a college/university scope toggle and a debounced name
 * search. Both write to the URL query string so the server component re-queries
 * on navigation.
 */
export function DirectoryFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scope = searchParams.get('scope') ?? 'college';

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="space-y-3">
      <div className="inline-flex rounded-lg bg-muted p-1 text-sm">
        {SCOPES.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setParam('scope', option.value)}
            className={cn(
              'rounded-md px-3 py-1.5 font-medium transition-colors',
              scope === option.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      <Input
        type="search"
        placeholder="Search students by name…"
        defaultValue={searchParams.get('q') ?? ''}
        onChange={(e) => setParam('q', e.target.value)}
      />
    </div>
  );
}
