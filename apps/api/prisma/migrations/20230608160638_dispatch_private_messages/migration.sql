-- AlterTable
ALTER TABLE "DispatchChat" ADD COLUMN     "callId" TEXT,
ADD COLUMN     "incidentId" TEXT;

-- AddForeignKey
ALTER TABLE "DispatchChat" ADD CONSTRAINT "DispatchChat_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call911"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchChat" ADD CONSTRAINT "DispatchChat_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "LeoIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
