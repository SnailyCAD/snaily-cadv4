/*
  Warnings:

  - You are about to drop the column `insuranceStatus` on the `RegisteredVehicle` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "ValueType" ADD VALUE 'VEHICLE_FLAG';

-- AlterTable
ALTER TABLE "RegisteredVehicle" DROP COLUMN "insuranceStatus",
ADD COLUMN     "insuranceStatusId" TEXT;

-- CreateTable
CREATE TABLE "_vehicleFlags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_vehicleFlags_AB_unique" ON "_vehicleFlags"("A", "B");

-- CreateIndex
CREATE INDEX "_vehicleFlags_B_index" ON "_vehicleFlags"("B");

-- AddForeignKey
ALTER TABLE "RegisteredVehicle" ADD CONSTRAINT "RegisteredVehicle_insuranceStatusId_fkey" FOREIGN KEY ("insuranceStatusId") REFERENCES "Value"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_vehicleFlags" ADD FOREIGN KEY ("A") REFERENCES "RegisteredVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_vehicleFlags" ADD FOREIGN KEY ("B") REFERENCES "Value"("id") ON DELETE CASCADE ON UPDATE CASCADE;
