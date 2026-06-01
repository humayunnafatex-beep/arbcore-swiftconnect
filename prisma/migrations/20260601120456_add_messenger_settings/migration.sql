-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "messengerPageAccessToken" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "messengerPageId" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "messengerVerifyToken" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "messengerWebhookUrl" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "MessageLog" ADD COLUMN     "channel" TEXT NOT NULL DEFAULT 'WHATSAPP';
