-- DropForeignKey
ALTER TABLE "Officer" DROP CONSTRAINT "Officer_divisionId_fkey";

-- AlterTable
ALTER TABLE "MiscCadSettings" ADD COLUMN     "maxDivisionsPerOfficer" INTEGER;

-- AlterTable
ALTER TABLE "Officer" ALTER COLUMN "divisionId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "_officerDivisionsToDivision" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_officerDivisionsToDivision_AB_unique" ON "_officerDivisionsToDivision"("A", "B");

-- CreateIndex
CREATE INDEX "_officerDivisionsToDivision_B_index" ON "_officerDivisionsToDivision"("B");

-- AddForeignKey
ALTER TABLE "Officer" ADD CONSTRAINT "Officer_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "DivisionValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_officerDivisionsToDivision" ADD FOREIGN KEY ("A") REFERENCES "DivisionValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_officerDivisionsToDivision" ADD FOREIGN KEY ("B") REFERENCES "Officer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
