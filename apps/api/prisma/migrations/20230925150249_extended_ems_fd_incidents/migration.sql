-- AlterTable
ALTER TABLE "EmsFdIncident" ADD COLUMN     "address" TEXT,
ADD COLUMN     "fireType" TEXT,
ADD COLUMN     "vehicleInvolved" BOOLEAN NOT NULL DEFAULT false;
