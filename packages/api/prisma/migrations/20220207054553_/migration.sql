-- AlterTable
ALTER TABLE "DiscordRoles" ADD COLUMN     "leoSupervisorRoleId" TEXT,
ADD COLUMN     "towRoleId" TEXT;

-- AddForeignKey
ALTER TABLE "DiscordRoles" ADD CONSTRAINT "DiscordRoles_leoSupervisorRoleId_fkey" FOREIGN KEY ("leoSupervisorRoleId") REFERENCES "DiscordRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscordRoles" ADD CONSTRAINT "DiscordRoles_towRoleId_fkey" FOREIGN KEY ("towRoleId") REFERENCES "DiscordRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;
