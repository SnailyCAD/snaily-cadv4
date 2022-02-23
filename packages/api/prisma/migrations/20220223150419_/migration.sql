/*
  Warnings:

  - You are about to drop the column `newSurame` on the `NameChangeRequest` table. All the data in the column will be lost.
  - Added the required column `newSurname` to the `NameChangeRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "NameChangeRequest" DROP COLUMN "newSurame",
ADD COLUMN     "newSurname" TEXT NOT NULL,
ADD COLUMN     "status" "WhitelistStatus" NOT NULL DEFAULT E'PENDING';
