/*
  Warnings:

  - You are about to drop the column `userId` on the `CustomRole` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "CustomRole" DROP CONSTRAINT "CustomRole_userId_fkey";

-- AlterTable
ALTER TABLE "CustomRole" DROP COLUMN "userId";

-- CreateTable
CREATE TABLE "_CustomRoleToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CustomRoleToUser_AB_unique" ON "_CustomRoleToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_CustomRoleToUser_B_index" ON "_CustomRoleToUser"("B");

-- AddForeignKey
ALTER TABLE "_CustomRoleToUser" ADD CONSTRAINT "_CustomRoleToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "CustomRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CustomRoleToUser" ADD CONSTRAINT "_CustomRoleToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
