/*
  Warnings:

  - Added the required column `discordRoleId` to the `CustomRole` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CustomRole" ADD COLUMN     "discordRoleId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "CustomRole" ADD CONSTRAINT "CustomRole_discordRoleId_fkey" FOREIGN KEY ("discordRoleId") REFERENCES "DiscordRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
