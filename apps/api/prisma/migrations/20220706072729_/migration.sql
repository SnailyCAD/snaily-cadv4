-- AlterTable
ALTER TABLE "CustomRole" ADD COLUMN     "discordRoleId" TEXT;

-- AddForeignKey
ALTER TABLE "CustomRole" ADD CONSTRAINT "CustomRole_discordRoleId_fkey" FOREIGN KEY ("discordRoleId") REFERENCES "DiscordRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;
