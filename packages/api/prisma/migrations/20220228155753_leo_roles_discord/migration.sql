-- CreateTable
CREATE TABLE "_leoRoles" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_leoRoles_AB_unique" ON "_leoRoles"("A", "B");

-- CreateIndex
CREATE INDEX "_leoRoles_B_index" ON "_leoRoles"("B");

-- AddForeignKey
ALTER TABLE "_leoRoles" ADD FOREIGN KEY ("A") REFERENCES "DiscordRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_leoRoles" ADD FOREIGN KEY ("B") REFERENCES "DiscordRoles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
