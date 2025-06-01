-- DropForeignKey
ALTER TABLE "ImpoundedVehicle" DROP CONSTRAINT "ImpoundedVehicle_registeredVehicleId_fkey";

-- AddForeignKey
ALTER TABLE "ImpoundedVehicle" ADD CONSTRAINT "ImpoundedVehicle_registeredVehicleId_fkey" FOREIGN KEY ("registeredVehicleId") REFERENCES "RegisteredVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
