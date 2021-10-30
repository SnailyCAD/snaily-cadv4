-- DropForeignKey
ALTER TABLE "RegisteredVehicle" DROP CONSTRAINT "RegisteredVehicle_modelId_fkey";

-- AddForeignKey
ALTER TABLE "RegisteredVehicle" ADD CONSTRAINT "RegisteredVehicle_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "VehicleValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
