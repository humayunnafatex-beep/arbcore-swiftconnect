-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "lastReferralAt" TIMESTAMP(3),
ADD COLUMN     "lastReferralBody" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "lastReferralCtwaClid" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "lastReferralHeadline" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "lastReferralImageUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "lastReferralMediaType" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "lastReferralSourceId" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "lastReferralSourceType" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "lastReferralSourceUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "lastReferralVideoUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "profileSource" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "whatsappProfileName" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "MessageLog" ADD COLUMN     "referralBody" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "referralCtwaClid" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "referralHeadline" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "referralImageUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "referralMediaType" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "referralSourceId" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "referralSourceType" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "referralSourceUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "referralVideoUrl" TEXT NOT NULL DEFAULT '';
