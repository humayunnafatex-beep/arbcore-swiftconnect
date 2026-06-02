-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "audienceChannel" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "audienceLimit" INTEGER,
ADD COLUMN     "audienceSearch" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "audienceStatus" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "audienceTags" TEXT NOT NULL DEFAULT '';
