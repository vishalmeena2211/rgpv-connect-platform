import Link from 'next/link';
import { ChevronRight, Download, FileText, NotebookText } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChipLink, ChipRow } from '@/components/ui/chip';
import { Select } from '@/components/ui/input';
import { Stars } from '@/components/ui/stars';
import { batchTag, formatBytes, formatCount, initials } from '@/lib/utils';

import type { ResourceCard as ResourceCardData, Scope, SubjectOption } from './queries';

/** "B.Tech › Computer Science › Semester 5 · Change", with a small GET form to change it. */
export function ScopeBar({
  scope,
  branches,
  basePath,
}: {
  scope: Scope;
  branches: { code: string; name: string }[];
  basePath: '/notes' | '/papers';
}) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-1.5 text-xs text-muted-foreground [&::-webkit-details-marker]:hidden">
        <span>B.Tech</span>
        <ChevronRight className="size-3 text-faint" />
        <span>{scope.branchName}</span>
        <ChevronRight className="size-3 text-faint" />
        <b className="font-semibold text-foreground">Semester {scope.semester}</b>
        <span className="ml-2 font-semibold text-accent-foreground group-open:hidden">Change</span>
      </summary>
      <form action={basePath} className="mt-3 flex flex-wrap items-end gap-2 rounded-md border bg-card p-3 shadow-card">
        <label className="flex flex-col gap-1 text-xs font-semibold">
          Branch
          <Select name="branch" defaultValue={scope.branchCode} className="h-9 w-56">
            {branches.map((b) => (
              <option key={b.code} value={b.code}>
                {b.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          Semester
          <Select name="semester" defaultValue={String(scope.semester)} className="h-9 w-36">
            {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                Semester {n}
              </option>
            ))}
          </Select>
        </label>
        <Button type="submit" size="sm">
          Show
        </Button>
      </form>
    </details>
  );
}

export function SubjectChips({
  subjects,
  active,
  hrefFor,
}: {
  subjects: SubjectOption[];
  active: number | null;
  hrefFor: (subjectId: number | null) => string;
}) {
  return (
    <ChipRow>
      <ChipLink href={hrefFor(null)} on={active === null}>
        All subjects
      </ChipLink>
      {subjects.map((s) => (
        <ChipLink key={s.id} href={hrefFor(s.id)} on={active === s.id}>
          {s.code ? `${s.code} ` : ''}
          {s.name}
        </ChipLink>
      ))}
    </ChipRow>
  );
}

/** A note card: what it covers, rating, downloads, size, and who shared it. */
export function ResourceCard({ resource }: { resource: ResourceCardData }) {
  const meta = [
    resource.pageCount ? `${resource.pageCount} pages` : null,
    formatBytes(resource.fileSize),
  ].filter(Boolean);
  return (
    <article className="flex flex-col gap-2.5 rounded-lg border bg-card p-4 shadow-card">
      <Link href={`/resources/${resource.id}`} className="font-display text-[13px] font-semibold leading-[18px] hover:underline">
        {resource.subject.code ? `${resource.subject.code} · ` : ''}
        {resource.title}
      </Link>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <Stars rating={resource.rating} count={resource.ratingCount} />
        <span className="text-faint">·</span>
        <span className="inline-flex items-center gap-1 tabular">
          <Download className="size-3" />
          {formatCount(resource.downloadCount)}
        </span>
        {meta.length ? (
          <>
            <span className="text-faint">·</span>
            <span>{['PDF', ...meta].join(' · ')}</span>
          </>
        ) : null}
      </div>
      <div className="mt-auto flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <span className="grid size-[26px] shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent to-accent-strong font-display text-[10px] font-bold text-accent-foreground">
            {initials(resource.uploader.name)}
          </span>
          <span className="truncate">
            {resource.uploader.name}
            {batchTag(resource.uploader.branchCode, resource.uploader.graduatingBatch) ? ` · ${batchTag(resource.uploader.branchCode, resource.uploader.graduatingBatch)}` : ''}
          </span>
          {resource.uploader.verified ? <Badge variant="verified">Verified</Badge> : null}
        </span>
        <Button asChild size="sm" variant="outline">
          <Link href={`/resources/${resource.id}`}>Open</Link>
        </Button>
      </div>
    </article>
  );
}

export function ResourceIcon({ type }: { type: 'NOTE' | 'PAPER' }) {
  const Icon = type === 'NOTE' ? NotebookText : FileText;
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent">
      <Icon className="size-4 text-accent-foreground" />
    </span>
  );
}
