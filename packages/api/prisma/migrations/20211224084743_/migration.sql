/*
  Warnings:

  - You are about to drop the column `recordsId` on the `Violation` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Violation" DROP CONSTRAINT "Violation_recordsId_fkey";

-- AlterTable
ALTER TABLE "Violation" DROP COLUMN "recordsId";
