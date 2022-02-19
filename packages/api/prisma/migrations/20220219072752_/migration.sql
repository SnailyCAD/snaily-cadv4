-- AlterTable
ALTER TABLE "DiscordRoles" ADD COLUMN     "taxiRoleId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isTaxi" BOOLEAN NOT NULL DEFAULT true;

-- AddForeignKey
ALTER TABLE "DiscordRoles" ADD CONSTRAINT "DiscordRoles_taxiRoleId_fkey" FOREIGN KEY ("taxiRoleId") REFERENCES "DiscordRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;
