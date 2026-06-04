-- CreateTable
CREATE TABLE "AutoReplyEvent" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "ruleId" TEXT,
    "ruleName" TEXT NOT NULL DEFAULT '',
    "channel" TEXT NOT NULL DEFAULT 'WHATSAPP',
    "customerKey" TEXT NOT NULL DEFAULT '',
    "inboundTextPreview" TEXT NOT NULL DEFAULT '',
    "replyPreview" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'ATTEMPTED',
    "providerMessageId" TEXT NOT NULL DEFAULT '',
    "errorMessage" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutoReplyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AutoReplyEvent_companyId_createdAt_idx" ON "AutoReplyEvent"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "AutoReplyEvent_companyId_channel_createdAt_idx" ON "AutoReplyEvent"("companyId", "channel", "createdAt");

-- CreateIndex
CREATE INDEX "AutoReplyEvent_ruleId_idx" ON "AutoReplyEvent"("ruleId");

-- CreateIndex
CREATE INDEX "AutoReplyEvent_status_idx" ON "AutoReplyEvent"("status");

-- AddForeignKey
ALTER TABLE "AutoReplyEvent" ADD CONSTRAINT "AutoReplyEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
