-- CreateEnum
CREATE TYPE "JobSource" AS ENUM ('PLACEMENT_CELL', 'RECRUITER');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('OFF_TOPIC', 'SPAM', 'HARASSMENT', 'PERSONAL_INFO', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'UPHELD', 'DISMISSED');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'RELEASED', 'KEPT');

-- CreateEnum
CREATE TYPE "DeletionStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeclarationStatus" AS ENUM ('RUNNING', 'COMPLETED', 'STOPPED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'RESULT_DECLARED';
ALTER TYPE "NotificationType" ADD VALUE 'RESOURCE_REVIEWED';

-- DropForeignKey
ALTER TABLE "Resource" DROP CONSTRAINT "Resource_uploaderId_fkey";

-- AlterTable
ALTER TABLE "Branch" ADD COLUMN     "code" TEXT;

-- AlterTable
ALTER TABLE "College" ADD COLUMN     "shortName" TEXT,
ADD COLUMN     "studentCount" INTEGER;

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "branchCode" TEXT,
ADD COLUMN     "graduatingBatch" INTEGER,
ADD COLUMN     "slug" TEXT;

-- AlterTable
ALTER TABLE "JobPost" ADD COLUMN     "applyClicks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "batches" INTEGER[],
ADD COLUMN     "branches" TEXT[],
ADD COLUMN     "closesAt" TIMESTAMP(3),
ADD COLUMN     "pay" TEXT,
ADD COLUMN     "source" "JobSource" NOT NULL DEFAULT 'RECRUITER';

-- AlterTable
ALTER TABLE "MarketListing" ADD COLUMN     "pickup" TEXT,
ADD COLUMN     "soldAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "data" JSONB,
ALTER COLUMN "actorId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "hiddenAt" TIMESTAMP(3),
ADD COLUMN     "removalReason" TEXT,
ADD COLUMN     "removedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Resource" ADD COLUMN     "declaredOwnWork" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "downloadCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "fileKey" TEXT,
ADD COLUMN     "fileSize" INTEGER,
ADD COLUMN     "pageCount" INTEGER,
ADD COLUMN     "reviewNote" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT,
ADD COLUMN     "session" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "credits" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" TIMESTAMP(3),
ADD COLUMN     "notifyMessages" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyResults" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyReviews" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifySocial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "postingSuspendedUntil" TIMESTAMP(3),
ADD COLUMN     "showOnBoard" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "ResultCache" (
    "id" TEXT NOT NULL,
    "enrollment" TEXT NOT NULL,
    "semester" INTEGER NOT NULL,
    "found" BOOLEAN NOT NULL DEFAULT true,
    "status" "ResultStatus",
    "sgpa" DOUBLE PRECISION,
    "cgpa" DOUBLE PRECISION,
    "payload" JSONB,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResultCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareCard" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT,
    "enrollment" TEXT NOT NULL,
    "semester" INTEGER NOT NULL,
    "showName" BOOLEAN NOT NULL DEFAULT false,
    "showCgpa" BOOLEAN NOT NULL DEFAULT true,
    "showRank" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostLike" (
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostLike_pkey" PRIMARY KEY ("postId","userId")
);

-- CreateTable
CREATE TABLE "CohortSize" (
    "id" TEXT NOT NULL,
    "collegeCode" TEXT NOT NULL,
    "branchCode" TEXT NOT NULL,
    "graduatingBatch" INTEGER NOT NULL,
    "size" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CohortSize_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "postId" TEXT,
    "listingId" TEXT,
    "reason" "ReportReason" NOT NULL,
    "note" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdentityDispute" (
    "id" TEXT NOT NULL,
    "enrollmentNumber" TEXT NOT NULL,
    "claimantId" TEXT NOT NULL,
    "holderId" TEXT NOT NULL,
    "note" TEXT,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "resolutionNote" TEXT,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdentityDispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeletionRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userLabel" TEXT NOT NULL,
    "reason" TEXT,
    "status" "DeletionStatus" NOT NULL DEFAULT 'PENDING',
    "eligibleAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeletionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultsDeclaration" (
    "id" TEXT NOT NULL,
    "semester" INTEGER NOT NULL,
    "admissionYear" INTEGER NOT NULL,
    "status" "DeclarationStatus" NOT NULL DEFAULT 'RUNNING',
    "totalStudents" INTEGER NOT NULL DEFAULT 0,
    "processed" INTEGER NOT NULL DEFAULT 0,
    "fetched" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "notified" INTEGER NOT NULL DEFAULT 0,
    "cursor" TEXT,
    "sampleCheck" JSONB,
    "startedById" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "ResultsDeclaration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "resetAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "ResultCache_fetchedAt_idx" ON "ResultCache"("fetchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ResultCache_enrollment_semester_key" ON "ResultCache"("enrollment", "semester");

-- CreateIndex
CREATE UNIQUE INDEX "ShareCard_token_key" ON "ShareCard"("token");

-- CreateIndex
CREATE INDEX "ShareCard_userId_idx" ON "ShareCard"("userId");

-- CreateIndex
CREATE INDEX "PostLike_userId_idx" ON "PostLike"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CohortSize_collegeCode_branchCode_graduatingBatch_key" ON "CohortSize"("collegeCode", "branchCode", "graduatingBatch");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Report_reporterId_postId_key" ON "Report"("reporterId", "postId");

-- CreateIndex
CREATE UNIQUE INDEX "Report_reporterId_listingId_key" ON "Report"("reporterId", "listingId");

-- CreateIndex
CREATE INDEX "IdentityDispute_status_createdAt_idx" ON "IdentityDispute"("status", "createdAt");

-- CreateIndex
CREATE INDEX "IdentityDispute_enrollmentNumber_idx" ON "IdentityDispute"("enrollmentNumber");

-- CreateIndex
CREATE INDEX "DeletionRequest_status_eligibleAt_idx" ON "DeletionRequest"("status", "eligibleAt");

-- CreateIndex
CREATE INDEX "ResultsDeclaration_status_idx" ON "ResultsDeclaration"("status");

-- CreateIndex
CREATE INDEX "ResultsDeclaration_admissionYear_semester_idx" ON "ResultsDeclaration"("admissionYear", "semester");

-- CreateIndex
CREATE INDEX "RateLimit_resetAt_idx" ON "RateLimit"("resetAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_yearId_code_key" ON "Branch"("yearId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Group_slug_key" ON "Group"("slug");

-- CreateIndex
CREATE INDEX "JobPost_closesAt_idx" ON "JobPost"("closesAt");

-- CreateIndex
CREATE INDEX "Resource_status_createdAt_idx" ON "Resource"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ResultRecord_semester_cgpa_idx" ON "ResultRecord"("semester", "cgpa");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_semesterId_code_key" ON "Subject"("semesterId", "code");

-- CreateIndex
CREATE INDEX "User_admissionYear_verificationStatus_idx" ON "User"("admissionYear", "verificationStatus");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareCard" ADD CONSTRAINT "ShareCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostLike" ADD CONSTRAINT "PostLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostLike" ADD CONSTRAINT "PostLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdentityDispute" ADD CONSTRAINT "IdentityDispute_claimantId_fkey" FOREIGN KEY ("claimantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdentityDispute" ADD CONSTRAINT "IdentityDispute_holderId_fkey" FOREIGN KEY ("holderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeletionRequest" ADD CONSTRAINT "DeletionRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultsDeclaration" ADD CONSTRAINT "ResultsDeclaration_startedById_fkey" FOREIGN KEY ("startedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Backfilled existing rows via the default above; drop it so the column matches @updatedAt.
ALTER TABLE "Resource" ALTER COLUMN "updatedAt" DROP DEFAULT;
