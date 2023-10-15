-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DriversLicenseCategoryType" ADD VALUE 'HUNTING';
ALTER TYPE "DriversLicenseCategoryType" ADD VALUE 'FISHING';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LicenseExamType" ADD VALUE 'HUNTING';
ALTER TYPE "LicenseExamType" ADD VALUE 'FISHING';

-- AlterTable
ALTER TABLE "Citizen" ADD COLUMN     "fishingLicenseId" TEXT,
ADD COLUMN     "fishingLicenseNumber" TEXT,
ADD COLUMN     "huntingLicenseId" TEXT,
ADD COLUMN     "huntingLicenseNumber" TEXT;

-- AlterTable
ALTER TABLE "CitizenLicensePoints" ADD COLUMN     "fishingLicensePoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "huntingLicensePoints" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "MiscCadSettings" ADD COLUMN     "fishingLicenseMaxPoints" INTEGER DEFAULT 12,
ADD COLUMN     "fishingLicenseNumberLength" INTEGER DEFAULT 8,
ADD COLUMN     "fishingLicenseTemplate" TEXT,
ADD COLUMN     "huntingLicenseMaxPoints" INTEGER DEFAULT 12,
ADD COLUMN     "huntingLicenseNumberLength" INTEGER DEFAULT 8,
ADD COLUMN     "huntingLicenseTemplate" TEXT;

-- AlterTable
ALTER TABLE "SuspendedCitizenLicenses" ADD COLUMN     "fishingLicense" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fishingLicenseTimeEnd" TIMESTAMP(3),
ADD COLUMN     "huntingLicense" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "huntingLicenseTimeEnd" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Citizen" ADD CONSTRAINT "Citizen_huntingLicenseId_fkey" FOREIGN KEY ("huntingLicenseId") REFERENCES "Value"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Citizen" ADD CONSTRAINT "Citizen_fishingLicenseId_fkey" FOREIGN KEY ("fishingLicenseId") REFERENCES "Value"("id") ON DELETE SET NULL ON UPDATE CASCADE;
