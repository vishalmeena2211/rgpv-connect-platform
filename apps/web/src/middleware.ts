import NextAuth from 'next-auth';

import { authConfig } from '@/auth.config';

// Edge middleware uses the lightweight config (no Prisma) to gate routes.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Everything except static assets, image optimisation and public files.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|pdf|js|webmanifest|txt)$).*)',
  ],
};
