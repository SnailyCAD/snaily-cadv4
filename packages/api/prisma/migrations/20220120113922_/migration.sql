/*
  Warnings:

  - You are about to drop the column `descriptionData` on the `Bolo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BleeterPost" ADD COLUMN     "bodyData" JSONB,
ALTER COLUMN "body" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Bolo" DROP COLUMN "descriptionData";
