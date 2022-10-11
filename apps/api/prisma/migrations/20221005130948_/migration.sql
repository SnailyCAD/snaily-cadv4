-- CreateEnum
CREATE TYPE "LicenseExamType" AS ENUM ('DRIVER', 'FIREARM', 'WATER', 'PILOT');

-- AlterEnum
ALTER TYPE "Feature" ADD VALUE 'LICENSE_EXAMS';

-- AlterTable
ALTER TABLE "DriversLicenseCategoryValue" ADD COLUMN     "licenseExamId" TEXT;

-- CreateTable
CREATE TABLE "LicenseExam" (
    "id" TEXT NOT NULL,
    "theoryExam" "DLExamPassType",
    "practiceExam" "DLExamPassType",
    "status" "DLExamStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "LicenseExamType" NOT NULL,
    "citizenId" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,

    CONSTRAINT "LicenseExam_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DriversLicenseCategoryValue" ADD CONSTRAINT "DriversLicenseCategoryValue_licenseExamId_fkey" FOREIGN KEY ("licenseExamId") REFERENCES "LicenseExam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseExam" ADD CONSTRAINT "LicenseExam_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseExam" ADD CONSTRAINT "LicenseExam_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "Value"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
