/*
  Warnings:

  - You are about to drop the column `autoSetPropertiesUserId` on the `cad` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "cad" DROP CONSTRAINT "cad_autoSetPropertiesUserId_fkey";

-- AlterTable
ALTER TABLE "cad" DROP COLUMN "autoSetPropertiesUserId",
ADD COLUMN     "autoSetUserPropertiesId" TEXT;

-- AddForeignKey
ALTER TABLE "cad" ADD CONSTRAINT "cad_autoSetUserPropertiesId_fkey" FOREIGN KEY ("autoSetUserPropertiesId") REFERENCES "AutoSetPropertiesUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
