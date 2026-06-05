-- CreateTable
CREATE TABLE "SavedReply" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "body" TEXT NOT NULL,
    "shortcut" TEXT NOT NULL DEFAULT '',
    "channel" TEXT NOT NULL DEFAULT 'ALL',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedReply_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedReply_companyId_idx" ON "SavedReply"("companyId");

-- CreateIndex
CREATE INDEX "SavedReply_companyId_status_idx" ON "SavedReply"("companyId", "status");

-- CreateIndex
CREATE INDEX "SavedReply_companyId_category_idx" ON "SavedReply"("companyId", "category");

-- AddForeignKey
ALTER TABLE "SavedReply" ADD CONSTRAINT "SavedReply_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
