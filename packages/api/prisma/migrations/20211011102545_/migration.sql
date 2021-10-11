/*
  Warnings:

  - You are about to drop the column `ccw` on the `Citizen` table. All the data in the column will be lost.
  - You are about to drop the column `driversLicense` on the `Citizen` table. All the data in the column will be lost.
  - You are about to drop the column `ethnicity` on the `Citizen` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `Citizen` table. All the data in the column will be lost.
  - You are about to drop the column `pilotLicense` on the `Citizen` table. All the data in the column will be lost.
  - You are about to drop the column `weaponLicense` on the `Citizen` table. All the data in the column will be lost.
  - You are about to drop the column `model` on the `RegisteredVehicle` table. All the data in the column will be lost.
  - You are about to drop the column `registrationStatus` on the `RegisteredVehicle` table. All the data in the column will be lost.
  - You are about to drop the column `model` on the `Weapon` table. All the data in the column will be lost.
  - You are about to drop the column `registrationStatus` on the `Weapon` table. All the data in the column will be lost.
  - Added the required column `ethnicityId` to the `Citizen` table without a default value. This is not possible if the table is not empty.
  - Added the required column `genderId` to the `Citizen` table without a default value. This is not possible if the table is not empty.
  - Added the required column `modelId` to the `RegisteredVehicle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `registrationStatusId` to the `RegisteredVehicle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `modelId` to the `Weapon` table without a default value. This is not possible if the table is not empty.
  - Added the required column `registrationStatusId` to the `Weapon` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Citizen" DROP COLUMN "ccw",
DROP COLUMN "driversLicense",
DROP COLUMN "ethnicity",
DROP COLUMN "gender",
DROP COLUMN "pilotLicense",
DROP COLUMN "weaponLicense",
ADD COLUMN     "ccwId" TEXT,
ADD COLUMN     "driversLicenseId" TEXT,
ADD COLUMN     "ethnicityId" TEXT NOT NULL,
ADD COLUMN     "genderId" TEXT NOT NULL,
ADD COLUMN     "pilotLicenseId" TEXT,
ADD COLUMN     "weaponLicenseId" TEXT;

-- AlterTable
ALTER TABLE "RegisteredVehicle" DROP COLUMN "model",
DROP COLUMN "registrationStatus",
ADD COLUMN     "modelId" TEXT NOT NULL,
ADD COLUMN     "registrationStatusId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Weapon" DROP COLUMN "model",
DROP COLUMN "registrationStatus",
ADD COLUMN     "modelId" TEXT NOT NULL,
ADD COLUMN     "registrationStatusId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Citizen" ADD CONSTRAINT "Citizen_genderId_fkey" FOREIGN KEY ("genderId") REFERENCES "Value"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Citizen" ADD CONSTRAINT "Citizen_ethnicityId_fkey" FOREIGN KEY ("ethnicityId") REFERENCES "Value"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Citizen" ADD CONSTRAINT "Citizen_driversLicenseId_fkey" FOREIGN KEY ("driversLicenseId") REFERENCES "Value"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Citizen" ADD CONSTRAINT "Citizen_weaponLicenseId_fkey" FOREIGN KEY ("weaponLicenseId") REFERENCES "Value"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Citizen" ADD CONSTRAINT "Citizen_pilotLicenseId_fkey" FOREIGN KEY ("pilotLicenseId") REFERENCES "Value"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Citizen" ADD CONSTRAINT "Citizen_ccwId_fkey" FOREIGN KEY ("ccwId") REFERENCES "Value"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegisteredVehicle" ADD CONSTRAINT "RegisteredVehicle_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Value"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegisteredVehicle" ADD CONSTRAINT "RegisteredVehicle_registrationStatusId_fkey" FOREIGN KEY ("registrationStatusId") REFERENCES "Value"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Weapon" ADD CONSTRAINT "Weapon_registrationStatusId_fkey" FOREIGN KEY ("registrationStatusId") REFERENCES "Value"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Weapon" ADD CONSTRAINT "Weapon_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Value"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
