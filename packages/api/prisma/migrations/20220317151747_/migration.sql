-- CreateTable
CREATE TABLE "_emsFdRoles" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_emsFdRoles_AB_unique" ON "_emsFdRoles"("A", "B");

-- CreateIndex
CREATE INDEX "_emsFdRoles_B_index" ON "_emsFdRoles"("B");

-- AddForeignKey
ALTER TABLE "_emsFdRoles" ADD FOREIGN KEY ("A") REFERENCES "DiscordRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_emsFdRoles" ADD FOREIGN KEY ("B") REFERENCES "DiscordRoles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
