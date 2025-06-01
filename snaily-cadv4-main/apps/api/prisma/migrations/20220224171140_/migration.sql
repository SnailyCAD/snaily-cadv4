-- AlterTable
ALTER TABLE "DepartmentValue" ADD COLUMN     "statusValueId" TEXT;

-- AddForeignKey
ALTER TABLE "DepartmentValue" ADD CONSTRAINT "DepartmentValue_statusValueId_fkey" FOREIGN KEY ("statusValueId") REFERENCES "StatusValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
