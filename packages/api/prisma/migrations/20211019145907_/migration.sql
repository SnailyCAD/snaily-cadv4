/*
  Warnings:

  - You are about to drop the `ArrestReport` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Ticket` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "RecordType" AS ENUM ('ARREST_REPORT', 'TICKET', 'WRITTEN_WARNING');

-- DropForeignKey
ALTER TABLE "ArrestReport" DROP CONSTRAINT "ArrestReport_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "ArrestReport" DROP CONSTRAINT "ArrestReport_officerId_fkey";

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_officerId_fkey";

-- AlterTable
ALTER TABLE "Officer" ADD COLUMN     "badgeNumber" INTEGER;

-- DropTable
DROP TABLE "ArrestReport";

-- DropTable
DROP TABLE "Ticket";

-- CreateTable
CREATE TABLE "PenalCode" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "recordId" TEXT,

    CONSTRAINT "PenalCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Record" (
    "id" TEXT NOT NULL,
    "type" "RecordType" NOT NULL,
    "citizenId" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postal" VARCHAR(255) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "Record_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PenalCode" ADD CONSTRAINT "PenalCode_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "Record"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
