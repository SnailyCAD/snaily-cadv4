-- CreateTable
CREATE TABLE "_adminRoles" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_adminRoles_AB_unique" ON "_adminRoles"("A", "B");

-- CreateIndex
CREATE INDEX "_adminRoles_B_index" ON "_adminRoles"("B");

-- AddForeignKey
ALTER TABLE "_adminRoles" ADD CONSTRAINT "_adminRoles_A_fkey" FOREIGN KEY ("A") REFERENCES "DiscordRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_adminRoles" ADD CONSTRAINT "_adminRoles_B_fkey" FOREIGN KEY ("B") REFERENCES "DiscordRoles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
