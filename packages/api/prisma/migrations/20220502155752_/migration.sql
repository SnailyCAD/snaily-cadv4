-- AlterTable
ALTER TABLE "CombinedLeoUnit" ADD COLUMN     "activeCallId" TEXT;

-- AddForeignKey
ALTER TABLE "CombinedLeoUnit" ADD CONSTRAINT "CombinedLeoUnit_activeCallId_fkey" FOREIGN KEY ("activeCallId") REFERENCES "Call911"("id") ON DELETE SET NULL ON UPDATE CASCADE;
