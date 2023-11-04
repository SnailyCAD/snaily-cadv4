-- DropForeignKey
ALTER TABLE "Violation" DROP CONSTRAINT "Violation_penalCodeId_fkey";

-- AlterTable
ALTER TABLE "Violation" ALTER COLUMN "penalCodeId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Violation" ADD CONSTRAINT "Violation_penalCodeId_fkey" FOREIGN KEY ("penalCodeId") REFERENCES "PenalCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
