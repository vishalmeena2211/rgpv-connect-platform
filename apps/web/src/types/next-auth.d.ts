import type { VerificationStatus } from '@rgpv/shared';
import type { DefaultSession } from 'next-auth';

/**
 * Module augmentation: extend the Auth.js session/JWT with our DB user id and
 * RGPV verification status so they're strongly typed everywhere.
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      verificationStatus?: VerificationStatus;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    verificationStatus?: VerificationStatus;
  }
}
