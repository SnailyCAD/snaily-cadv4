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
    "driverLastResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pilotLicensePoints" INTEGER NOT NULL DEFAULT 0,
    "pilotLastResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "waterLicensePoints" INTEGER NOT NULL DEFAULT 0,
    "waterLastResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firearmsLicensePoints" INTEGER NOT NULL DEFAULT 0,
    "firearmsLastResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CitizenLicensePoints_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Citizen" ADD CONSTRAINT "Citizen_licensePointsId_fkey" FOREIGN KEY ("licensePointsId") REFERENCES "CitizenLicensePoints"("id") ON DELETE SET NULL ON UPDATE CASCADE;
