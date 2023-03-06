-- AlterTable
ALTER TABLE "ActiveDispatchers" ADD COLUMN     "departmentId" TEXT;

-- AddForeignKey
ALTER TABLE "ActiveDispatchers" ADD CONSTRAINT "ActiveDispatchers_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "DepartmentValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
