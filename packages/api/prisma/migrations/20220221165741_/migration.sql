-- AlterTable
ALTER TABLE "Officer" ADD COLUMN     "activeIncidentId" TEXT;

-- AddForeignKey
ALTER TABLE "Officer" ADD CONSTRAINT "Officer_activeIncidentId_fkey" FOREIGN KEY ("activeIncidentId") REFERENCES "LeoIncident"("id") ON DELETE SET NULL ON UPDATE CASCADE;
