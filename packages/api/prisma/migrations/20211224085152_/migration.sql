/*
  Warnings:

  - The `fine` column on the `Violation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `jailTime` column on the `Violation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `bail` column on the `Violation` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Violation" DROP COLUMN "fine",
ADD COLUMN     "fine" INTEGER,
DROP COLUMN "jailTime",
ADD COLUMN     "jailTime" INTEGER,
DROP COLUMN "bail",
ADD COLUMN     "bail" INTEGER;

-- CreateTable
CREATE TABLE "_PenalCodeToViolation" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_PenalCodeToViolation_AB_unique" ON "_PenalCodeToViolation"("A", "B");

-- CreateIndex
CREATE INDEX "_PenalCodeToViolation_B_index" ON "_PenalCodeToViolation"("B");

-- AddForeignKey
ALTER TABLE "_PenalCodeToViolation" ADD FOREIGN KEY ("A") REFERENCES "PenalCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PenalCodeToViolation" ADD FOREIGN KEY ("B") REFERENCES "Violation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
