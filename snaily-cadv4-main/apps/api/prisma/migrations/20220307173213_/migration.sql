-- AlterTable
ALTER TABLE "Citizen" ADD COLUMN     "waterLicenseId" TEXT;

-- AddForeignKey
ALTER TABLE "Citizen" ADD CONSTRAINT "Citizen_waterLicenseId_fkey" FOREIGN KEY ("waterLicenseId") REFERENCES "Value"("id") ON DELETE SET NULL ON UPDATE CASCADE;
