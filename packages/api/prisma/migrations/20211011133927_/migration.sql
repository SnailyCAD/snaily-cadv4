/*
  Warnings:

  - You are about to drop the column `citizenId` on the `TowCall` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "TowCall" DROP CONSTRAINT "TowCall_citizenId_fkey";

-- AlterTable
ALTER TABLE "TowCall" DROP COLUMN "citizenId",
ADD COLUMN     "assignedUnitId" TEXT;

-- AddForeignKey
ALTER TABLE "TowCall" ADD CONSTRAINT "TowCall_assignedUnitId_fkey" FOREIGN KEY ("assignedUnitId") REFERENCES "Citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;
