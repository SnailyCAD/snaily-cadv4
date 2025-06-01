-- CreateEnum
CREATE TYPE "ValueLicenseType" AS ENUM ('LICENSE', 'REGISTRATION_STATUS');

-- AlterTable
ALTER TABLE "Value" ADD COLUMN     "licenseType" "ValueLicenseType";
