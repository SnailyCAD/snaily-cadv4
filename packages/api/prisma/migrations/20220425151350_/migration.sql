/*
  Warnings:

  - You are about to drop the column `departmentValueId` on the `UnitQualification` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "QualificationValue" DROP CONSTRAINT "QualificationValue_valueId_fkey";

-- DropForeignKey
ALTER TABLE "UnitQualification" DROP CONSTRAINT "UnitQualification_departmentValueId_fkey";

-- DropForeignKey
ALTER TABLE "UnitQualification" DROP CONSTRAINT "UnitQualification_emsFdDeputyId_fkey";

-- DropForeignKey
ALTER TABLE "UnitQualification" DROP CONSTRAINT "UnitQualification_officerId_fkey";

-- AlterTable
ALTER TABLE "UnitQualification" DROP COLUMN "departmentValueId",
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "UnitQualification" ADD CONSTRAINT "UnitQualification_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitQualification" ADD CONSTRAINT "UnitQualification_emsFdDeputyId_fkey" FOREIGN KEY ("emsFdDeputyId") REFERENCES "EmsFdDeputy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualificationValue" ADD CONSTRAINT "QualificationValue_valueId_fkey" FOREIGN KEY ("valueId") REFERENCES "Value"("id") ON DELETE CASCADE ON UPDATE CASCADE;
