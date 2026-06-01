-- CreateTable
CREATE TABLE "ConversationState" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "contactKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversationState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConversationState_companyId_status_idx" ON "ConversationState"("companyId", "status");

-- CreateIndex
CREATE INDEX "ConversationState_assignedToId_idx" ON "ConversationState"("assignedToId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationState_companyId_channel_contactKey_key" ON "ConversationState"("companyId", "channel", "contactKey");

-- AddForeignKey
ALTER TABLE "ConversationState" ADD CONSTRAINT "ConversationState_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationState" ADD CONSTRAINT "ConversationState_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
