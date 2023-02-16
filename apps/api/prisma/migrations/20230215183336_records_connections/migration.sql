-- AlterTable
ALTER TABLE "Record" ADD COLUMN     "call911Id" TEXT,
ADD COLUMN     "incidentId" TEXT;

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_call911Id_fkey" FOREIGN KEY ("call911Id") REFERENCES "Call911"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "LeoIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
