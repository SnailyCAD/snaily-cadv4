-- CreateTable
CREATE TABLE "_dispatchRoles" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_leoSupervisorRoles" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_taxiRoles" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_towRoles" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_dispatchRoles_AB_unique" ON "_dispatchRoles"("A", "B");

-- CreateIndex
CREATE INDEX "_dispatchRoles_B_index" ON "_dispatchRoles"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_leoSupervisorRoles_AB_unique" ON "_leoSupervisorRoles"("A", "B");

-- CreateIndex
CREATE INDEX "_leoSupervisorRoles_B_index" ON "_leoSupervisorRoles"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_taxiRoles_AB_unique" ON "_taxiRoles"("A", "B");

-- CreateIndex
CREATE INDEX "_taxiRoles_B_index" ON "_taxiRoles"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_towRoles_AB_unique" ON "_towRoles"("A", "B");

-- CreateIndex
CREATE INDEX "_towRoles_B_index" ON "_towRoles"("B");

-- AddForeignKey
ALTER TABLE "_dispatchRoles" ADD FOREIGN KEY ("A") REFERENCES "DiscordRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_dispatchRoles" ADD FOREIGN KEY ("B") REFERENCES "DiscordRoles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_leoSupervisorRoles" ADD FOREIGN KEY ("A") REFERENCES "DiscordRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_leoSupervisorRoles" ADD FOREIGN KEY ("B") REFERENCES "DiscordRoles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_taxiRoles" ADD FOREIGN KEY ("A") REFERENCES "DiscordRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_taxiRoles" ADD FOREIGN KEY ("B") REFERENCES "DiscordRoles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_towRoles" ADD FOREIGN KEY ("A") REFERENCES "DiscordRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_towRoles" ADD FOREIGN KEY ("B") REFERENCES "DiscordRoles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
