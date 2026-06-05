-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "followUpAt" TIMESTAMP(3),
ADD COLUMN     "followUpDone" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Order_companyId_followUpAt_idx" ON "Order"("companyId", "followUpAt");
