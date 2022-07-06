-- DropForeignKey
ALTER TABLE "CustomRole" DROP CONSTRAINT "CustomRole_discordRoleId_fkey";

-- AlterTable
ALTER TABLE "CustomRole" ALTER COLUMN "discordRoleId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "CustomRole" ADD CONSTRAINT "CustomRole_discordRoleId_fkey" FOREIGN KEY ("discordRoleId") REFERENCES "DiscordRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;
