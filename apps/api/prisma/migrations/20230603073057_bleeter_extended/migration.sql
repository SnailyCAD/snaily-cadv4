/*
  Warnings:

  - You are about to drop the column `citizenId` on the `BleeterProfile` table. All the data in the column will be lost.
  - Added the required column `name` to the `BleeterProfile` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "BleeterProfile" DROP CONSTRAINT "BleeterProfile_citizenId_fkey";

-- AlterTable
ALTER TABLE "BleeterProfile" DROP COLUMN "citizenId",
ADD COLUMN     "name" VARCHAR(255) NOT NULL;
