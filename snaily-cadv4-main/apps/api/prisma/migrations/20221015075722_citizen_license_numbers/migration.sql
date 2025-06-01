-- AlterTable
ALTER TABLE "Citizen" ADD COLUMN     "driversLicenseNumber" TEXT,
ADD COLUMN     "pilotLicenseNumber" TEXT,
ADD COLUMN     "waterLicenseNumber" TEXT,
ADD COLUMN     "weaponLicenseNumber" TEXT;

-- AlterTable
ALTER TABLE "MiscCadSettings" ADD COLUMN     "driversLicenseNumberLength" INTEGER DEFAULT 8,
ADD COLUMN     "pilotLicenseNumberLength" INTEGER DEFAULT 6,
ADD COLUMN     "waterLicenseNumberLength" INTEGER DEFAULT 8,
ADD COLUMN     "weaponLicenseNumberLength" INTEGER DEFAULT 8;
