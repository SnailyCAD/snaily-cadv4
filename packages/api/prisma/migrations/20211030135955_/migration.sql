/*
  Warnings:

  - You are about to drop the column `name` on the `Officer` table. All the data in the column will be lost.
  - Made the column `citizenId` on table `EmsFdDeputy` required. This step will fail if there are existing NULL values in that column.
  - Made the column `citizenId` on table `Officer` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "EmsFdDeputy" ALTER COLUMN "citizenId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Officer" DROP COLUMN "name",
ALTER COLUMN "citizenId" SET NOT NULL;
