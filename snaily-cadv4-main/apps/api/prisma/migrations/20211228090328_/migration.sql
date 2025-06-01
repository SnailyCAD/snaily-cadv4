/*
  Warnings:

  - You are about to drop the column `recordId` on the `PenalCode` table. All the data in the column will be lost.
  - You are about to drop the `_PenalCodeToRecord` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ReleaseType" AS ENUM ('TIME_OUT', 'BAIL_POSTED');

-- DropForeignKey
ALTER TABLE "_PenalCodeToRecord" DROP CONSTRAINT "_PenalCodeToRecord_A_fkey";

-- DropForeignKey
ALTER TABLE "_PenalCodeToRecord" DROP CONSTRAINT "_PenalCodeToRecord_B_fkey";

-- AlterTable
ALTER TABLE "Citizen" ADD COLUMN     "arrested" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "PenalCode" DROP COLUMN "recordId",
ADD COLUMN     "warningApplicableId" TEXT,
ADD COLUMN     "warningNotApplicableId" TEXT;

-- AlterTable
ALTER TABLE "Record" ADD COLUMN     "releaseId" TEXT;

-- DropTable
DROP TABLE "_PenalCodeToRecord";

-- CreateTable
CREATE TABLE "WarningApplicable" (
    "id" TEXT NOT NULL,
    "fines" INTEGER[],

    CONSTRAINT "WarningApplicable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarningNotApplicable" (
    "id" TEXT NOT NULL,
    "fines" INTEGER[],
    "prisonTerm" INTEGER[],
    "bail" INTEGER[],

    CONSTRAINT "WarningNotApplicable_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "RecordRelease" (
    "id" TEXT NOT NULL,
    "type" "ReleaseType" NOT NULL,
    "citizenId" TEXT,

    CONSTRAINT "RecordRelease_pkey" PRIMARY KEY ("id")
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
ALTER TABLE "PenalCode" ADD CONSTRAINT "PenalCode_warningApplicableId_fkey" FOREIGN KEY ("warningApplicableId") REFERENCES "WarningApplicable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PenalCode" ADD CONSTRAINT "PenalCode_warningNotApplicableId_fkey" FOREIGN KEY ("warningNotApplicableId") REFERENCES "WarningNotApplicable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Violation" ADD CONSTRAINT "Violation_penalCodeId_fkey" FOREIGN KEY ("penalCodeId") REFERENCES "PenalCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "RecordRelease"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordRelease" ADD CONSTRAINT "RecordRelease_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RecordToViolation" ADD FOREIGN KEY ("A") REFERENCES "Record"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RecordToViolation" ADD FOREIGN KEY ("B") REFERENCES "Violation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
