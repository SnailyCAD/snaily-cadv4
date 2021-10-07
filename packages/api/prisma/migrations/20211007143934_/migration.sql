/*
  Warnings:

  - You are about to drop the column `fullName` on the `Citizen` table. All the data in the column will be lost.
  - Added the required column `name` to the `Citizen` table without a default value. This is not possible if the table is not empty.
  - Added the required column `surname` to the `Citizen` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Citizen" DROP COLUMN "fullName",
ADD COLUMN     "name" VARCHAR(255) NOT NULL,
ADD COLUMN     "surname" VARCHAR(255) NOT NULL;
