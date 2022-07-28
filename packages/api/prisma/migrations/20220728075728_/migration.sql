-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "translationKey" TEXT,
ALTER COLUMN "type" DROP NOT NULL;
