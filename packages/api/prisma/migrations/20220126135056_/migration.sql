/*
  Warnings:

  - Made the column `departmentId` on table `LeoWhitelistStatus` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "LeoWhitelistStatus" DROP CONSTRAINT "LeoWhitelistStatus_departmentId_fkey";

-- AlterTable
ALTER TABLE "LeoWhitelistStatus" ALTER COLUMN "departmentId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "LeoWhitelistStatus" ADD CONSTRAINT "LeoWhitelistStatus_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "DepartmentValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
