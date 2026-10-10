import 'server-only';

import { unstable_cache } from 'next/cache';
import { prisma } from '@rgpv/db';

/** Facts for the landing page's proof strip. Cached for an hour. */
export const getPublicStats = unstable_cache(
  async () => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const [checkedToday, flagship] = await Promise.all([
      prisma.resultCache.count({ where: { fetchedAt: { gte: startOfDay } } }),
      prisma.college.findUnique({
        where: { code: '0151' },
        select: { shortName: true, _count: { select: { users: { where: { verificationStatus: 'VERIFIED' } } } } },
      }),
    ]);
    return {
      checkedToday,
      flagshipName: flagship?.shortName ?? 'UIT-RGPV',
      flagshipVerified: flagship?._count.users ?? 0,
    };
  },
  ['public-stats'],
  { revalidate: 3600 },
);

/** College code → short name, for decoding chips. Cached for a day. */
export const getCollegeNames = unstable_cache(
  async (): Promise<Record<string, string>> => {
    const colleges = await prisma.college.findMany({ select: { code: true, name: true, shortName: true } });
    return Object.fromEntries(colleges.map((c) => [c.code, c.shortName ?? c.name]));
  },
  ['college-names'],
  { revalidate: 86_400 },
);
