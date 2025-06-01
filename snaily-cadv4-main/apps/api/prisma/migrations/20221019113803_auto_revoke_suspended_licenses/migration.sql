-- AlterTable
ALTER TABLE "SuspendedCitizenLicenses" ADD COLUMN     "driverLicenseTimeEnd" TIMESTAMP(3),
ADD COLUMN     "firearmsLicenseTimeEnd" TIMESTAMP(3),
ADD COLUMN     "pilotLicenseTimeEnd" TIMESTAMP(3),
ADD COLUMN     "waterLicenseTimeEnd" TIMESTAMP(3);
