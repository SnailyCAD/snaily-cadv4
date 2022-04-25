/*
  Warnings:

  - You are about to drop the column `departmentId` on the `UnitQualification` table. All the data in the column will be lost.
  - Added the required column `qualificationId` to the `UnitQualification` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "UnitQualification" DROP CONSTRAINT "UnitQualification_departmentId_fkey";

-- AlterTable
ALTER TABLE "UnitQualification" DROP COLUMN "departmentId",
ADD COLUMN     "departmentValueId" TEXT,
ADD COLUMN     "qualificationId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "UnitQualification" ADD CONSTRAINT "UnitQualification_departmentValueId_fkey" FOREIGN KEY ("departmentValueId") REFERENCES "DepartmentValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitQualification" ADD CONSTRAINT "UnitQualification_qualificationId_fkey" FOREIGN KEY ("qualificationId") REFERENCES "QualificationValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
