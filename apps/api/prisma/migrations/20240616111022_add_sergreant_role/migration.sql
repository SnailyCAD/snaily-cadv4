-- AlterTable
ALTER TABLE "DiscordRoles" ADD COLUMN     "sergeantRolePermissions" TEXT[];

-- CreateTable
CREATE TABLE "_sergeantRoles" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_sergeantRoles_AB_unique" ON "_sergeantRoles"("A", "B");

-- CreateIndex
CREATE INDEX "_sergeantRoles_B_index" ON "_sergeantRoles"("B");

-- AddForeignKey
ALTER TABLE "_sergeantRoles" ADD CONSTRAINT "_sergeantRoles_A_fkey" FOREIGN KEY ("A") REFERENCES "DiscordRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_sergeantRoles" ADD CONSTRAINT "_sergeantRoles_B_fkey" FOREIGN KEY ("B") REFERENCES "DiscordRoles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
