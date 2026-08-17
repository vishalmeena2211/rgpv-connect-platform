/**
 * @rgpv/db — shared Prisma client.
 *
 * Exposes a singleton `prisma` client (guarded against hot-reload duplication
 * in development) plus a re-export of all generated Prisma types/enums so
 * consumers import everything from one place.
 */
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export * from '@prisma/client';
