-- AlterTable
ALTER TABLE "ConversationState" ADD COLUMN     "followUpAt" TIMESTAMP(3),
ADD COLUMN     "followUpDone" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "internalNote" TEXT NOT NULL DEFAULT '';
