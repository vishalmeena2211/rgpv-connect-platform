import type { DefaultSession } from 'next-auth';
import type { UserRole, VerificationStatus } from '@rgpv/shared';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      verificationStatus?: VerificationStatus;
      role?: UserRole;
    } & DefaultSession['user'];
  }
}
