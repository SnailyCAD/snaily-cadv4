-- AlterTable
ALTER TABLE "DiscordRoles" ADD COLUMN     "adminRoleId" TEXT;

-- AddForeignKey
ALTER TABLE "DiscordRoles" ADD CONSTRAINT "DiscordRoles_adminRoleId_fkey" FOREIGN KEY ("adminRoleId") REFERENCES "DiscordRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;
