-- AlterTable
ALTER TABLE "Call911" ADD COLUMN     "situationCodeId" TEXT;

-- AddForeignKey
ALTER TABLE "Call911" ADD CONSTRAINT "Call911_situationCodeId_fkey" FOREIGN KEY ("situationCodeId") REFERENCES "StatusValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
