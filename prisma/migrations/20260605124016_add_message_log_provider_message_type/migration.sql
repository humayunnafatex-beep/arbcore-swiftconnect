-- AlterTable
ALTER TABLE "MessageLog" ADD COLUMN     "providerMessageType" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "providerMetadataSummary" TEXT NOT NULL DEFAULT '';
