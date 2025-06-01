/*
  Warnings:

  - You are about to drop the `_dlPilotCategoryToDLCategory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_dlPilotCategoryToDLCategory" DROP CONSTRAINT "_dlPilotCategoryToDLCategory_A_fkey";

-- DropForeignKey
ALTER TABLE "_dlPilotCategoryToDLCategory" DROP CONSTRAINT "_dlPilotCategoryToDLCategory_B_fkey";

-- DropTable
DROP TABLE "_dlPilotCategoryToDLCategory";
