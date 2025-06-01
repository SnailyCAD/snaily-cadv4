-- AlterEnum
ALTER TYPE "ValueType" ADD VALUE 'EMERGENCY_VEHICLE';

-- AlterTable
ALTER TABLE "CombinedLeoUnit" ADD COLUMN     "activeVehicleId" TEXT;

-- AlterTable
ALTER TABLE "EmsFdDeputy" ADD COLUMN     "activeVehicleId" TEXT;

-- AlterTable
ALTER TABLE "Officer" ADD COLUMN     "activeVehicleId" TEXT;

-- CreateTable
CREATE TABLE "EmergencyVehicleValue" (
    "id" TEXT NOT NULL,
    "valueId" TEXT NOT NULL,

    CONSTRAINT "EmergencyVehicleValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DivisionValueToEmergencyVehicleValue" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_DepartmentValueToEmergencyVehicleValue" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_DivisionValueToEmergencyVehicleValue_AB_unique" ON "_DivisionValueToEmergencyVehicleValue"("A", "B");

-- CreateIndex
CREATE INDEX "_DivisionValueToEmergencyVehicleValue_B_index" ON "_DivisionValueToEmergencyVehicleValue"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_DepartmentValueToEmergencyVehicleValue_AB_unique" ON "_DepartmentValueToEmergencyVehicleValue"("A", "B");

-- CreateIndex
CREATE INDEX "_DepartmentValueToEmergencyVehicleValue_B_index" ON "_DepartmentValueToEmergencyVehicleValue"("B");

-- AddForeignKey
ALTER TABLE "EmergencyVehicleValue" ADD CONSTRAINT "EmergencyVehicleValue_valueId_fkey" FOREIGN KEY ("valueId") REFERENCES "Value"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Officer" ADD CONSTRAINT "Officer_activeVehicleId_fkey" FOREIGN KEY ("activeVehicleId") REFERENCES "EmergencyVehicleValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombinedLeoUnit" ADD CONSTRAINT "CombinedLeoUnit_activeVehicleId_fkey" FOREIGN KEY ("activeVehicleId") REFERENCES "EmergencyVehicleValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmsFdDeputy" ADD CONSTRAINT "EmsFdDeputy_activeVehicleId_fkey" FOREIGN KEY ("activeVehicleId") REFERENCES "EmergencyVehicleValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DivisionValueToEmergencyVehicleValue" ADD CONSTRAINT "_DivisionValueToEmergencyVehicleValue_A_fkey" FOREIGN KEY ("A") REFERENCES "DivisionValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DivisionValueToEmergencyVehicleValue" ADD CONSTRAINT "_DivisionValueToEmergencyVehicleValue_B_fkey" FOREIGN KEY ("B") REFERENCES "EmergencyVehicleValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DepartmentValueToEmergencyVehicleValue" ADD CONSTRAINT "_DepartmentValueToEmergencyVehicleValue_A_fkey" FOREIGN KEY ("A") REFERENCES "DepartmentValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DepartmentValueToEmergencyVehicleValue" ADD CONSTRAINT "_DepartmentValueToEmergencyVehicleValue_B_fkey" FOREIGN KEY ("B") REFERENCES "EmergencyVehicleValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
