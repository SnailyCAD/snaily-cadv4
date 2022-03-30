-- AlterTable
ALTER TABLE "DLExam" ADD COLUMN     "licenseId" TEXT;

-- AddForeignKey
ALTER TABLE "DLExam" ADD CONSTRAINT "DLExam_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "Value"("id") ON DELETE SET NULL ON UPDATE CASCADE;
