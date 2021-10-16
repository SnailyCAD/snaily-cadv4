/*
  Warnings:

  - You are about to drop the column `statusId` on the `Officer` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "StatusEnum" AS ENUM ('ON_DUTY', 'OFF_DUTY');

-- DropForeignKey
ALTER TABLE "Officer" DROP CONSTRAINT "Officer_statusId_fkey";

-- AlterTable
ALTER TABLE "Officer" DROP COLUMN "statusId",
ADD COLUMN     "status" "StatusEnum" NOT NULL DEFAULT E'OFF_DUTY';
