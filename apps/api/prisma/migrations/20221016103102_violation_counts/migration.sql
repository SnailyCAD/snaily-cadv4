/*
  Warnings:

  - Added the required column `counts` to the `Violation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Violation" ADD COLUMN     "counts" INTEGER NOT NULL;
