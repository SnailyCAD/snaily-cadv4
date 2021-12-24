/*
  Warnings:

  - You are about to drop the `_PenalCodeToViolation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_PenalCodeToViolation" DROP CONSTRAINT "_PenalCodeToViolation_A_fkey";

-- DropForeignKey
ALTER TABLE "_PenalCodeToViolation" DROP CONSTRAINT "_PenalCodeToViolation_B_fkey";

-- DropTable
DROP TABLE "_PenalCodeToViolation";
