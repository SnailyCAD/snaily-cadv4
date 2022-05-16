-- DropForeignKey
ALTER TABLE "CourtDate" DROP CONSTRAINT "CourtDate_courtEntryId_fkey";

-- AddForeignKey
ALTER TABLE "CourtDate" ADD CONSTRAINT "CourtDate_courtEntryId_fkey" FOREIGN KEY ("courtEntryId") REFERENCES "CourtEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
