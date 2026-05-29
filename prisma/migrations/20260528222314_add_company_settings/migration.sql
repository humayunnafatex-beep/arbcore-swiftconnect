-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'English',
ADD COLUMN     "notificationBilling" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notificationFailed" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notificationHotLead" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notificationWeekly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Asia/Dhaka',
ADD COLUMN     "website" TEXT NOT NULL DEFAULT '';
