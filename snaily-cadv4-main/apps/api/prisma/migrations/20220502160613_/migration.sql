-- AlterTable
ALTER TABLE "CombinedLeoUnit" ADD COLUMN     "activeCallId" TEXT;

-- AlterTable
ALTER TABLE "EmsFdDeputy" ADD COLUMN     "activeCallId" TEXT;

-- AlterTable
ALTER TABLE "Officer" ADD COLUMN     "activeCallId" TEXT;

-- AddForeignKey
ALTER TABLE "Officer" ADD CONSTRAINT "Officer_activeCallId_fkey" FOREIGN KEY ("activeCallId") REFERENCES "Call911"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombinedLeoUnit" ADD CONSTRAINT "CombinedLeoUnit_activeCallId_fkey" FOREIGN KEY ("activeCallId") REFERENCES "Call911"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmsFdDeputy" ADD CONSTRAINT "EmsFdDeputy_activeCallId_fkey" FOREIGN KEY ("activeCallId") REFERENCES "Call911"("id") ON DELETE SET NULL ON UPDATE CASCADE;
