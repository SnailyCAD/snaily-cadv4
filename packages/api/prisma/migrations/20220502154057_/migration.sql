-- AlterTable
ALTER TABLE "EmsFdDeputy" ADD COLUMN     "activeCallId" TEXT;

-- AddForeignKey
ALTER TABLE "EmsFdDeputy" ADD CONSTRAINT "EmsFdDeputy_activeCallId_fkey" FOREIGN KEY ("activeCallId") REFERENCES "Call911"("id") ON DELETE SET NULL ON UPDATE CASCADE;
