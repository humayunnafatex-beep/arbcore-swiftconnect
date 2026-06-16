-- CreateTable
CREATE TABLE "BusinessKnowledgeFact" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessKnowledgeFact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusinessKnowledgeFact_companyId_idx" ON "BusinessKnowledgeFact"("companyId");

-- CreateIndex
CREATE INDEX "BusinessKnowledgeFact_companyId_isActive_idx" ON "BusinessKnowledgeFact"("companyId", "isActive");

-- CreateIndex
CREATE INDEX "BusinessKnowledgeFact_companyId_category_idx" ON "BusinessKnowledgeFact"("companyId", "category");

-- AddForeignKey
ALTER TABLE "BusinessKnowledgeFact" ADD CONSTRAINT "BusinessKnowledgeFact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
