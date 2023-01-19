-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_executorId_fkey";

-- AlterTable
ALTER TABLE "AuditLog" ALTER COLUMN "executorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_executorId_fkey" FOREIGN KEY ("executorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
