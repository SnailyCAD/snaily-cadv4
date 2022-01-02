-- AlterTable
ALTER TABLE "Call911" ADD COLUMN     "ended" BOOLEAN DEFAULT false;

-- CreateTable
CREATE TABLE "_Call911ToLeoIncident" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_Call911ToLeoIncident_AB_unique" ON "_Call911ToLeoIncident"("A", "B");

-- CreateIndex
CREATE INDEX "_Call911ToLeoIncident_B_index" ON "_Call911ToLeoIncident"("B");

-- AddForeignKey
ALTER TABLE "_Call911ToLeoIncident" ADD FOREIGN KEY ("A") REFERENCES "Call911"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Call911ToLeoIncident" ADD FOREIGN KEY ("B") REFERENCES "LeoIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
