/*
  Warnings:

  - You are about to drop the column `recordId` on the `PenalCode` table. All the data in the column will be lost.
  - You are about to drop the `_PenalCodeToRecord` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_PenalCodeToRecord" DROP CONSTRAINT "_PenalCodeToRecord_A_fkey";

-- DropForeignKey
ALTER TABLE "_PenalCodeToRecord" DROP CONSTRAINT "_PenalCodeToRecord_B_fkey";

-- AlterTable
ALTER TABLE "PenalCode" DROP COLUMN "recordId";

-- DropTable
DROP TABLE "_PenalCodeToRecord";

-- CreateTable
CREATE TABLE "Violation" (
    "id" TEXT NOT NULL,
    "fine" INTEGER,
    "jailTime" INTEGER,
    "bail" INTEGER,
    "penalCodeId" TEXT NOT NULL,

    CONSTRAINT "Violation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RecordToViolation" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_RecordToViolation_AB_unique" ON "_RecordToViolation"("A", "B");

-- CreateIndex
CREATE INDEX "_RecordToViolation_B_index" ON "_RecordToViolation"("B");

-- AddForeignKey
ALTER TABLE "Violation" ADD CONSTRAINT "Violation_penalCodeId_fkey" FOREIGN KEY ("penalCodeId") REFERENCES "PenalCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RecordToViolation" ADD FOREIGN KEY ("A") REFERENCES "Record"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RecordToViolation" ADD FOREIGN KEY ("B") REFERENCES "Violation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
