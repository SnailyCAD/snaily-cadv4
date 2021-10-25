/*
  Warnings:

  - You are about to drop the column `assignedStatusCode` on the `MiscCadSettings` table. All the data in the column will be lost.
  - You are about to drop the column `onDutyCode` on the `MiscCadSettings` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ShouldDoType" ADD VALUE 'SET_ON_DUTY';
ALTER TYPE "ShouldDoType" ADD VALUE 'SET_ASSIGNED';

-- AlterTable
ALTER TABLE "MiscCadSettings" DROP COLUMN "assignedStatusCode",
DROP COLUMN "onDutyCode";
