-- DropForeignKey
ALTER TABLE "DivisionValue" DROP CONSTRAINT "DivisionValue_departmentId_fkey";

-- AddForeignKey
ALTER TABLE "DivisionValue" ADD CONSTRAINT "DivisionValue_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "DepartmentValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
