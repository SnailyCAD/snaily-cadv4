-- AlterTable
ALTER TABLE "DepartmentValue" ADD COLUMN     "defaultOfficerRankId" TEXT;

-- AddForeignKey
ALTER TABLE "DepartmentValue" ADD CONSTRAINT "DepartmentValue_defaultOfficerRankId_fkey" FOREIGN KEY ("defaultOfficerRankId") REFERENCES "Value"("id") ON DELETE SET NULL ON UPDATE CASCADE;
