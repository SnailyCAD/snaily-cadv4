-- AlterTable
ALTER TABLE "cad" ADD COLUMN     "discordRolesId" TEXT;

-- CreateTable
CREATE TABLE "DiscordRoles" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "leoRoleId" TEXT,
    "leoSupervisorRoleId" TEXT,
    "emsFdRoleId" TEXT,
    "dispatchRoleId" TEXT,
    "towRoleId" TEXT,

    CONSTRAINT "DiscordRoles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscordRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "discordRolesId" TEXT NOT NULL,

    CONSTRAINT "DiscordRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiscordRole_id_key" ON "DiscordRole"("id");

-- AddForeignKey
ALTER TABLE "cad" ADD CONSTRAINT "cad_discordRolesId_fkey" FOREIGN KEY ("discordRolesId") REFERENCES "DiscordRoles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscordRoles" ADD CONSTRAINT "DiscordRoles_leoRoleId_fkey" FOREIGN KEY ("leoRoleId") REFERENCES "DiscordRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscordRoles" ADD CONSTRAINT "DiscordRoles_leoSupervisorRoleId_fkey" FOREIGN KEY ("leoSupervisorRoleId") REFERENCES "DiscordRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscordRoles" ADD CONSTRAINT "DiscordRoles_emsFdRoleId_fkey" FOREIGN KEY ("emsFdRoleId") REFERENCES "DiscordRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscordRoles" ADD CONSTRAINT "DiscordRoles_dispatchRoleId_fkey" FOREIGN KEY ("dispatchRoleId") REFERENCES "DiscordRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscordRoles" ADD CONSTRAINT "DiscordRoles_towRoleId_fkey" FOREIGN KEY ("towRoleId") REFERENCES "DiscordRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscordRole" ADD CONSTRAINT "DiscordRole_discordRolesId_fkey" FOREIGN KEY ("discordRolesId") REFERENCES "DiscordRoles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
