'use client';

import { useState, useTransition } from 'react';
import { type SemesterResult } from '@rgpv/shared';
import { Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

import { lookupResult } from './actions';
import { ResultCard } from './result-card';

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

/**
 * Public result-lookup form. Lets anyone fetch a single semester result by
 * enrollment number + semester, calling the `lookupResult` server action and
 * rendering the parsed result (or an inline error) without a full navigation.
 */
export function ResultLookupForm() {
  const [enrollment, setEnrollment] = useState('');
  const [semester, setSemester] = useState<number>(1);
  const [result, setResult] = useState<SemesterResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);
    startTransition(async () => {
      const response = await lookupResult(enrollment.trim().toUpperCase(), semester);
      if (response.ok) {
        setResult(response.result);
      } else {
        setError(response.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
            <div className="space-y-1.5">
              <label htmlFor="enrollment" className="text-sm font-medium">
                Enrollment number
              </label>
              <Input
                id="enrollment"
                placeholder="0151CS211001"
                autoComplete="off"
                spellCheck={false}
                value={enrollment}
                onChange={(e) => setEnrollment(e.target.value)}
                className="uppercase"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="semester" className="text-sm font-medium">
                Semester
              </label>
              <select
                id="semester"
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-28"
              >
                {SEMESTERS.map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                <Search />
                {isPending ? 'Fetching…' : 'Get result'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {error ? (
        <Card className="border-destructive/40">
          <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      {isPending ? <ResultCardSkeleton /> : null}

      {result && !isPending ? <ResultCard result={result} /> : null}
    </div>
  );
}

/** Loading placeholder shown while a result is being fetched. */
function ResultCardSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-40 w-full" />
      </CardContent>
    </Card>
  );
}
