-- AlterEnum
ALTER TYPE "ValueType" ADD VALUE 'VEHICLE_TRIM_LEVEL';

-- CreateTable
CREATE TABLE "_registeredVehicleTrimLevels" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_vehicleTrimLevels" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_registeredVehicleTrimLevels_AB_unique" ON "_registeredVehicleTrimLevels"("A", "B");

-- CreateIndex
CREATE INDEX "_registeredVehicleTrimLevels_B_index" ON "_registeredVehicleTrimLevels"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_vehicleTrimLevels_AB_unique" ON "_vehicleTrimLevels"("A", "B");

-- CreateIndex
CREATE INDEX "_vehicleTrimLevels_B_index" ON "_vehicleTrimLevels"("B");

-- AddForeignKey
ALTER TABLE "_registeredVehicleTrimLevels" ADD CONSTRAINT "_registeredVehicleTrimLevels_A_fkey" FOREIGN KEY ("A") REFERENCES "RegisteredVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_registeredVehicleTrimLevels" ADD CONSTRAINT "_registeredVehicleTrimLevels_B_fkey" FOREIGN KEY ("B") REFERENCES "Value"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_vehicleTrimLevels" ADD CONSTRAINT "_vehicleTrimLevels_A_fkey" FOREIGN KEY ("A") REFERENCES "Value"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_vehicleTrimLevels" ADD CONSTRAINT "_vehicleTrimLevels_B_fkey" FOREIGN KEY ("B") REFERENCES "VehicleValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
