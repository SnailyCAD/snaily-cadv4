-- AlterTable
ALTER TABLE "DiscordRoles" ADD COLUMN     "courthouseRolePermissions" TEXT[];

-- CreateTable
CREATE TABLE "_courthouseRoles" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_courthouseRoles_AB_unique" ON "_courthouseRoles"("A", "B");

-- CreateIndex
CREATE INDEX "_courthouseRoles_B_index" ON "_courthouseRoles"("B");

-- AddForeignKey
ALTER TABLE "_courthouseRoles" ADD CONSTRAINT "_courthouseRoles_A_fkey" FOREIGN KEY ("A") REFERENCES "DiscordRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_courthouseRoles" ADD CONSTRAINT "_courthouseRoles_B_fkey" FOREIGN KEY ("B") REFERENCES "DiscordRoles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
