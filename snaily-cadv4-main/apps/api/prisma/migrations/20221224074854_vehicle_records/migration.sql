-- AlterTable
ALTER TABLE "Record" ADD COLUMN     "address" TEXT,
ADD COLUMN     "vehicleColor" TEXT,
ADD COLUMN     "vehicleId" TEXT,
ADD COLUMN     "vehicleModel" TEXT,
ADD COLUMN     "vehiclePlate" TEXT;

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "RegisteredVehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
