-- AlterTable
ALTER TABLE "LeoIncident" ADD COLUMN     "situationCodeId" TEXT;

-- AddForeignKey
ALTER TABLE "LeoIncident" ADD CONSTRAINT "LeoIncident_situationCodeId_fkey" FOREIGN KEY ("situationCodeId") REFERENCES "StatusValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
