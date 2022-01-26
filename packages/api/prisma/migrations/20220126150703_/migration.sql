-- DropForeignKey
ALTER TABLE "Officer" DROP CONSTRAINT "Officer_departmentId_fkey";

-- AlterTable
ALTER TABLE "Officer" ALTER COLUMN "departmentId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Officer" ADD CONSTRAINT "Officer_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "DepartmentValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
