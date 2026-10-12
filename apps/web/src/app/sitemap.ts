import type { MetadataRoute } from 'next';
import { prisma } from '@rgpv/db';

import { SITE_URL } from '@/lib/site';

/** Rebuilt at most once an hour, so new notes reach search engines the same day. */
export const revalidate = 3600;

/**
 * Every page a student might search for: the public pages, each branch and
 * semester that has published notes or papers, and every published note or
 * paper. Pages that need an account, and shared results, are left out.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/notes`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/papers`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/how-it-works`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/terms`, changeFrequency: 'yearly', priority: 0.2 },
  ];

  let resources: { id: string; type: 'NOTE' | 'PAPER'; updatedAt: Date; branch: string | null; semester: number }[] = [];
  try {
    const rows = await prisma.resource.findMany({
      where: { status: 'APPROVED' },
      orderBy: { updatedAt: 'desc' },
      take: 5000,
      select: {
        id: true,
        type: true,
        updatedAt: true,
        subject: { select: { semester: { select: { number: true, branch: { select: { code: true } } } } } },
      },
    });
    resources = rows.map((r) => ({
      id: r.id,
      type: r.type,
      updatedAt: r.updatedAt,
      branch: r.subject.semester.branch.code,
      semester: r.subject.semester.number,
    }));
  } catch {
    // A database hiccup still serves the public pages rather than an error.
  }

  const scopes = new Map<string, Date>();
  for (const r of resources) {
    if (!r.branch) continue;
    const path = `/${r.type === 'NOTE' ? 'notes' : 'papers'}?branch=${r.branch}&semester=${r.semester}`;
    const seen = scopes.get(path);
    if (!seen || r.updatedAt > seen) scopes.set(path, r.updatedAt);
  }
  for (const [path, lastModified] of scopes) {
    pages.push({ url: `${SITE_URL}${path.replace(/&/g, '&amp;')}`, lastModified, changeFrequency: 'weekly', priority: 0.7 });
  }
  for (const r of resources) {
    pages.push({ url: `${SITE_URL}/resources/${r.id}`, lastModified: r.updatedAt, changeFrequency: 'monthly', priority: 0.6 });
  }
  return pages;
}
