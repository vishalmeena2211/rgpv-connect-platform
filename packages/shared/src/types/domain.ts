/**
 * Cross-cutting domain enums shared across the platform.
 * These are kept in sync with the Prisma enums in `@rgpv/db`.
 */

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export type UserRole = 'STUDENT' | 'MENTOR' | 'ADMIN' | 'RECRUITER';

export type PostScope = 'COLLEGE' | 'UNIVERSITY' | 'GROUP';

export type GroupType = 'COLLEGE' | 'BRANCH' | 'INTEREST';

export type ResourceType = 'NOTE' | 'PAPER';

export type ModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type JobType = 'FULL_TIME' | 'INTERNSHIP' | 'PART_TIME';

export type ListingCategory = 'BOOKS' | 'ELECTRONICS' | 'NOTES' | 'HOSTEL' | 'OTHER';

export type ListingStatus = 'ACTIVE' | 'SOLD';

export type NotificationType = 'FOLLOW' | 'POST_LIKE' | 'POST_COMMENT' | 'MESSAGE';
