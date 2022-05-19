-- AlterTable
ALTER TABLE "Officer" ADD COLUMN     "activeDivisionCallsignId" TEXT;

-- AddForeignKey
ALTER TABLE "Officer" ADD CONSTRAINT "Officer_activeDivisionCallsignId_fkey" FOREIGN KEY ("activeDivisionCallsignId") REFERENCES "IndividualDivisionCallsign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
