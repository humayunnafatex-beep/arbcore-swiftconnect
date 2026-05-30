-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "whatsappAccessToken" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "whatsappPhoneNumberId" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "whatsappVerifyToken" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "whatsappWebhookUrl" TEXT NOT NULL DEFAULT '';
