-- AlterTable
ALTER TABLE "Citizen" ADD COLUMN     "suspendedLicensesId" TEXT;

-- CreateTable
CREATE TABLE "SuspendedCitizenLicenses" (
    "id" TEXT NOT NULL,
    "driverLicense" BOOLEAN NOT NULL DEFAULT false,
    "pilotLicense" BOOLEAN NOT NULL DEFAULT false,
    "waterLicense" BOOLEAN NOT NULL DEFAULT false,
    "firearmsLicense" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SuspendedCitizenLicenses_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Citizen" ADD CONSTRAINT "Citizen_suspendedLicensesId_fkey" FOREIGN KEY ("suspendedLicensesId") REFERENCES "SuspendedCitizenLicenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
