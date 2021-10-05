/*
  Warnings:

  - You are about to drop the column `cadId` on the `Citizen` table. All the data in the column will be lost.
  - You are about to drop the `_UsersToCad` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Citizen" DROP CONSTRAINT "Citizen_cadId_fkey";

-- DropForeignKey
ALTER TABLE "_UsersToCad" DROP CONSTRAINT "_UsersToCad_A_fkey";

-- DropForeignKey
ALTER TABLE "_UsersToCad" DROP CONSTRAINT "_UsersToCad_B_fkey";

-- AlterTable
ALTER TABLE "Citizen" DROP COLUMN "cadId",
ALTER COLUMN "driversLicense" DROP NOT NULL,
ALTER COLUMN "weaponLicense" DROP NOT NULL,
ALTER COLUMN "pilotLicense" DROP NOT NULL,
ALTER COLUMN "ccw" DROP NOT NULL,
ALTER COLUMN "dead" DROP NOT NULL,
ALTER COLUMN "dateOfDead" DROP NOT NULL;

-- DropTable
DROP TABLE "_UsersToCad";
