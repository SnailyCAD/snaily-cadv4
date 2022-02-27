/*
  Warnings:

  - You are about to drop the column `radioChannel` on the `CombinedLeoUnit` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CombinedLeoUnit" DROP COLUMN "radioChannel",
ADD COLUMN     "radioChannelId" TEXT;
