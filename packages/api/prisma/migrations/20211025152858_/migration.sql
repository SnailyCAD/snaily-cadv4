/*
  Warnings:

  - You are about to drop the column `status` on the `EmsFdDeputy` table. All the data in the column will be lost.
  - You are about to drop the column `status2Id` on the `EmsFdDeputy` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "EmsFdDeputy" DROP CONSTRAINT "EmsFdDeputy_status2Id_fkey";

-- AlterTable
ALTER TABLE "EmsFdDeputy" DROP COLUMN "status",
DROP COLUMN "status2Id",
ADD COLUMN     "statusId" TEXT;

-- AddForeignKey
ALTER TABLE "EmsFdDeputy" ADD CONSTRAINT "EmsFdDeputy_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "StatusValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
