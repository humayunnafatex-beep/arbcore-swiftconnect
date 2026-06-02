-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CampaignStatus" ADD VALUE 'READY';
ALTER TYPE "CampaignStatus" ADD VALUE 'ARCHIVED';

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "audienceNote" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "channel" TEXT NOT NULL DEFAULT 'WHATSAPP',
ADD COLUMN     "messageBody" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "notes" TEXT NOT NULL DEFAULT '';
