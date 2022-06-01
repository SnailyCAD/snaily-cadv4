-- AlterTable
ALTER TABLE "CombinedLeoUnit" ADD COLUMN     "activeIncidentId" TEXT;

-- AlterTable
ALTER TABLE "EmsFdDeputy" ADD COLUMN     "activeIncidentId" TEXT;

-- AddForeignKey
ALTER TABLE "CombinedLeoUnit" ADD CONSTRAINT "CombinedLeoUnit_activeIncidentId_fkey" FOREIGN KEY ("activeIncidentId") REFERENCES "LeoIncident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmsFdDeputy" ADD CONSTRAINT "EmsFdDeputy_activeIncidentId_fkey" FOREIGN KEY ("activeIncidentId") REFERENCES "LeoIncident"("id") ON DELETE SET NULL ON UPDATE CASCADE;
