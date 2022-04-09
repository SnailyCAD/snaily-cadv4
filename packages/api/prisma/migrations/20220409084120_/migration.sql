/*
  Warnings:

  - You are about to drop the column `leoIncidentId` on the `IncidentInvolvedUnit` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "IncidentInvolvedUnit" DROP CONSTRAINT "IncidentInvolvedUnit_leoIncidentId_fkey";

-- AlterTable
ALTER TABLE "IncidentInvolvedUnit" DROP COLUMN "leoIncidentId";
