/*
  Warnings:

  - You are about to alter the column `vinNumber` on the `RegisteredVehicle` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `color` on the `RegisteredVehicle` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `registrationStatus` on the `RegisteredVehicle` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `insuranceStatus` on the `RegisteredVehicle` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `value` on the `Value` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `serialNumber` on the `Weapon` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `registrationStatus` on the `Weapon` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - Added the required column `model` to the `Weapon` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RegisteredVehicle" ALTER COLUMN "vinNumber" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "color" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "registrationStatus" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "insuranceStatus" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "Value" ALTER COLUMN "value" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "Weapon" ADD COLUMN     "model" VARCHAR(255) NOT NULL,
ALTER COLUMN "serialNumber" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "registrationStatus" SET DATA TYPE VARCHAR(255);
