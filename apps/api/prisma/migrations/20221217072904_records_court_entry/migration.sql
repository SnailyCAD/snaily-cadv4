-- AlterTable
ALTER TABLE "Record" ADD COLUMN     "CourtEntryId" TEXT;

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_CourtEntryId_fkey" FOREIGN KEY ("CourtEntryId") REFERENCES "CourtEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
