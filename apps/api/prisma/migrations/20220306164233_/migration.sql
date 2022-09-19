-- CreateEnum
CREATE TYPE "VehicleInspectionStatus" AS ENUM ('PASSED', 'FAILED');

-- CreateEnum
CREATE TYPE "VehicleTaxStatus" AS ENUM ('TAXED', 'UNTAXED');

-- AlterTable
ALTER TABLE "RegisteredVehicle" ADD COLUMN     "inspectionStatus" "VehicleInspectionStatus",
ADD COLUMN     "taxStatus" "VehicleTaxStatus";
