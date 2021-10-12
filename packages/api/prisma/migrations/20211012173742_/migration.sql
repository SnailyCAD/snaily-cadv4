/*
  Warnings:

  - You are about to drop the column `citizenId` on the `BusinessPost` table. All the data in the column will be lost.
  - Added the required column `employeeId` to the `BusinessPost` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "BusinessPost" DROP CONSTRAINT "BusinessPost_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_roleId_fkey";

-- AlterTable
ALTER TABLE "BusinessPost" DROP COLUMN "citizenId",
ADD COLUMN     "employeeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "canCreatePosts" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "roleId" DROP NOT NULL,
ALTER COLUMN "employeeOfTheMonth" SET DEFAULT false;

-- AlterTable
ALTER TABLE "cad" ADD COLUMN     "miscCadSettingsId" TEXT;

-- CreateTable
CREATE TABLE "MiscCadSettings" (
    "id" TEXT NOT NULL,
    "heightPrefix" VARCHAR(255) NOT NULL DEFAULT E'cm',
    "weightPrefix" VARCHAR(255) NOT NULL DEFAULT E'kg',
    "maxCitizensPerUser" INTEGER,
    "maxPlateLength" INTEGER NOT NULL DEFAULT 8,
    "maxBusinessesPerCitizen" INTEGER,
    "assignedStatusCode" TEXT NOT NULL DEFAULT E'10-97',
    "onDutyCode" TEXT NOT NULL DEFAULT E'10-8',

    CONSTRAINT "MiscCadSettings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "cad" ADD CONSTRAINT "cad_miscCadSettingsId_fkey" FOREIGN KEY ("miscCadSettingsId") REFERENCES "MiscCadSettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Value"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessPost" ADD CONSTRAINT "BusinessPost_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
