/*
  Warnings:

  - You are about to drop the column `defaultDepartmentId` on the `LeoWhitelistStatus` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "LeoWhitelistStatus" DROP CONSTRAINT "LeoWhitelistStatus_defaultDepartmentId_fkey";

-- AlterTable
ALTER TABLE "LeoWhitelistStatus" DROP COLUMN "defaultDepartmentId",
ADD COLUMN     "departmentId" TEXT;

-- AddForeignKey
ALTER TABLE "LeoWhitelistStatus" ADD CONSTRAINT "LeoWhitelistStatus_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "DepartmentValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
