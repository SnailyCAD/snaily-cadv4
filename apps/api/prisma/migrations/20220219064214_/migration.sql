-- AlterTable
ALTER TABLE "DiscordRoles" ADD COLUMN     "whitelistedRoleId" TEXT;

-- AddForeignKey
ALTER TABLE "DiscordRoles" ADD CONSTRAINT "DiscordRoles_whitelistedRoleId_fkey" FOREIGN KEY ("whitelistedRoleId") REFERENCES "DiscordRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;
