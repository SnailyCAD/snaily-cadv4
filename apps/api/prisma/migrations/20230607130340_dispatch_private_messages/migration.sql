/*
  Warnings:

  - A unique constraint covering the columns `[unitId]` on the table `DispatchChat` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `unitId` to the `DispatchChat` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DispatchChat" ADD COLUMN     "unitId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "DispatchChat_unitId_key" ON "DispatchChat"("unitId");
