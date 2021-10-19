/*
  Warnings:

  - Added the required column `divisionId` to the `Officer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "ValueType" ADD VALUE 'DIVISION';

-- AlterTable
ALTER TABLE "Officer" ADD COLUMN     "divisionId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "DivisionValue" (
    "id" TEXT NOT NULL,
    "valueId" TEXT NOT NULL,
    "departmentId" TEXT,

    CONSTRAINT "DivisionValue_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DivisionValue" ADD CONSTRAINT "DivisionValue_valueId_fkey" FOREIGN KEY ("valueId") REFERENCES "Value"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DivisionValue" ADD CONSTRAINT "DivisionValue_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Value"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Officer" ADD CONSTRAINT "Officer_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "DivisionValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
