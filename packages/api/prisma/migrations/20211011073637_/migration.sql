/*
  Warnings:

  - You are about to alter the column `title` on the `BleeterPost` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `imageId` on the `BleeterPost` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.

*/
-- AlterTable
ALTER TABLE "BleeterPost" ALTER COLUMN "title" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "imageId" SET DATA TYPE VARCHAR(255);

-- CreateTable
CREATE TABLE "TowCall" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "citizenId" TEXT,
    "location" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,

    CONSTRAINT "TowCall_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TowCall" ADD CONSTRAINT "TowCall_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TowCall" ADD CONSTRAINT "TowCall_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TowCall" ADD CONSTRAINT "TowCall_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
