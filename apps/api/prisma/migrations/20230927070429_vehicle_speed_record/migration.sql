-- CreateEnum
CREATE TYPE "VehiclePaceType" AS ENUM ('PACE', 'RADAR', 'LASER', 'OTHER');

-- AlterTable
ALTER TABLE "Record" ADD COLUMN     "speedLimit" TEXT,
ADD COLUMN     "vehiclePaceType" "VehiclePaceType",
ADD COLUMN     "vehicleSpeed" TEXT;
