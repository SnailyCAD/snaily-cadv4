-- AlterTable
ALTER TABLE "DivisionValue" ADD COLUMN     "discordRoleId" TEXT;

-- AddForeignKey
ALTER TABLE "DivisionValue" ADD CONSTRAINT "DivisionValue_discordRoleId_fkey" FOREIGN KEY ("discordRoleId") REFERENCES "DiscordRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;
