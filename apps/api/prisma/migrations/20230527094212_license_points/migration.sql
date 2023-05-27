-- AlterTable
ALTER TABLE "Citizen" ADD COLUMN     "licensePointsId" TEXT;

-- AlterTable
ALTER TABLE "MiscCadSettings" ADD COLUMN     "driversLicenseMaxPoints" INTEGER DEFAULT 12,
ADD COLUMN     "pilotLicenseMaxPoints" INTEGER DEFAULT 12,
ADD COLUMN     "waterLicenseMaxPoints" INTEGER DEFAULT 12,
ADD COLUMN     "weaponLicenseMaxPoints" INTEGER DEFAULT 12;

-- CreateTable
CREATE TABLE "CitizenLicensePoints" (
    "id" TEXT NOT NULL,
    "driverLicensePoints" INTEGER NOT NULL DEFAULT 0,
    "pilotLicensePoints" INTEGER NOT NULL DEFAULT 0,
    "waterLicensePoints" INTEGER NOT NULL DEFAULT 0,
    "firearmsLicensePoints" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CitizenLicensePoints_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Citizen" ADD CONSTRAINT "Citizen_licensePointsId_fkey" FOREIGN KEY ("licensePointsId") REFERENCES "CitizenLicensePoints"("id") ON DELETE SET NULL ON UPDATE CASCADE;
