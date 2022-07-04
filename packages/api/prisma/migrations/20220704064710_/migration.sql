/*
  Warnings:

  - You are about to drop the column `warrantId` on the `AssignedUnit` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "AssignedUnit" DROP CONSTRAINT "AssignedUnit_warrantId_fkey";

-- AlterTable
ALTER TABLE "AssignedUnit" DROP COLUMN "warrantId";
