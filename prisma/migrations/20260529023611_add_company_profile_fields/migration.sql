-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "businessName" TEXT NOT NULL DEFAULT 'ARBCore AI',
ADD COLUMN     "workspaceName" TEXT NOT NULL DEFAULT 'Enterprise Workspace';
