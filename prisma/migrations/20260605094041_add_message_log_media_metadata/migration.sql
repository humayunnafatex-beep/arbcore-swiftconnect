-- AlterTable
ALTER TABLE "MessageLog" ADD COLUMN     "mediaFilename" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "mediaId" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "mediaMimeType" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "mediaSha256" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "mediaType" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "MessageLog_companyId_mediaId_idx" ON "MessageLog"("companyId", "mediaId");
