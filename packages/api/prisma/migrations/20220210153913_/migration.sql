/*
  Warnings:

  - You are about to drop the column `violationId` on the `SeizedItem` table. All the data in the column will be lost.
  - Added the required column `recordId` to the `SeizedItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "SeizedItem" DROP CONSTRAINT "SeizedItem_violationId_fkey";

-- AlterTable
ALTER TABLE "SeizedItem" DROP COLUMN "violationId",
ADD COLUMN     "recordId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "SeizedItem" ADD CONSTRAINT "SeizedItem_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "Record"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
