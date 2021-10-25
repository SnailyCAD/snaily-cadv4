/*
  Warnings:

  - You are about to drop the column `status` on the `Officer` table. All the data in the column will be lost.
  - You are about to drop the column `status2Id` on the `Officer` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Officer" DROP CONSTRAINT "Officer_status2Id_fkey";

-- AlterTable
ALTER TABLE "Officer" DROP COLUMN "status",
DROP COLUMN "status2Id",
ADD COLUMN     "statusId" TEXT;

-- AddForeignKey
ALTER TABLE "Officer" ADD CONSTRAINT "Officer_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "StatusValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
