-- AlterTable
ALTER TABLE "CombinedLeoUnit" ADD COLUMN     "activeVehicleId" TEXT;

-- AddForeignKey
ALTER TABLE "CombinedLeoUnit" ADD CONSTRAINT "CombinedLeoUnit_activeVehicleId_fkey" FOREIGN KEY ("activeVehicleId") REFERENCES "EmergencyVehicleValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
