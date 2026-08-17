import NextAuth from 'next-auth';

import { authConfig } from '@/auth.config';

// Edge middleware uses the lightweight config (no Prisma) to gate routes.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Run on everything except static assets and image optimisation.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
