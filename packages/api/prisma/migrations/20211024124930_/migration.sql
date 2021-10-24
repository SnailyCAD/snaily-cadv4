-- DropForeignKey
ALTER TABLE "PenalCode" DROP CONSTRAINT "PenalCode_recordId_fkey";

-- CreateTable
CREATE TABLE "_PenalCodeToRecord" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_PenalCodeToRecord_AB_unique" ON "_PenalCodeToRecord"("A", "B");

-- CreateIndex
CREATE INDEX "_PenalCodeToRecord_B_index" ON "_PenalCodeToRecord"("B");

-- AddForeignKey
ALTER TABLE "_PenalCodeToRecord" ADD FOREIGN KEY ("A") REFERENCES "PenalCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PenalCodeToRecord" ADD FOREIGN KEY ("B") REFERENCES "Record"("id") ON DELETE CASCADE ON UPDATE CASCADE;
