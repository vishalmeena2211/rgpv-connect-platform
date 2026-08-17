'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { type SubjectOption } from './queries';

/**
 * Subject filter for the resource browser. Selecting a subject pushes a
 * `?subject=<id>` query param; the parent server component re-queries on
 * navigation. Options are grouped by course + semester for scannability.
 */
export function ResourceFilter({ subjects }: { subjects: SubjectOption[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get('subject') ?? '';

  // Group subjects under a "Course · Semester N" label.
  const groups = new Map<string, SubjectOption[]>();
  for (const subject of subjects) {
    const key = `${subject.course} · Semester ${subject.semester}`;
    const bucket = groups.get(key);
    if (bucket) bucket.push(subject);
    else groups.set(key, [subject]);
  }

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    const params = new URLSearchParams(searchParams);
    if (value) params.set('subject', value);
    else params.delete('subject');
    router.push(`?${params.toString()}`);
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:max-w-xs"
      aria-label="Filter by subject"
    >
      <option value="">All subjects</option>
      {[...groups.entries()].map(([label, options]) => (
        <optgroup key={label} label={label}>
          {options.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
