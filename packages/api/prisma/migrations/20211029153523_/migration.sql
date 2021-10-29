-- CreateEnum
CREATE TYPE "DriversLicenseCategoryType" AS ENUM ('AUTOMOTIVE', 'AVIATION', 'WATER');

-- AlterEnum
ALTER TYPE "ShouldDoType" ADD VALUE 'PANIC_BUTTON';

-- AlterEnum
ALTER TYPE "ValueType" ADD VALUE 'DRIVERSLICENSE_CATEGORY';

-- CreateTable
CREATE TABLE "DriversLicenseCategoryValue" (
    "id" TEXT NOT NULL,
    "valueId" TEXT NOT NULL,
    "type" "DriversLicenseCategoryType" NOT NULL,

    CONSTRAINT "DriversLicenseCategoryValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_dlCategoryToDLCategory" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_dlPilotCategoryToDLCategory" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_dlCategoryToDLCategory_AB_unique" ON "_dlCategoryToDLCategory"("A", "B");

-- CreateIndex
CREATE INDEX "_dlCategoryToDLCategory_B_index" ON "_dlCategoryToDLCategory"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_dlPilotCategoryToDLCategory_AB_unique" ON "_dlPilotCategoryToDLCategory"("A", "B");

-- CreateIndex
CREATE INDEX "_dlPilotCategoryToDLCategory_B_index" ON "_dlPilotCategoryToDLCategory"("B");

-- AddForeignKey
ALTER TABLE "DriversLicenseCategoryValue" ADD CONSTRAINT "DriversLicenseCategoryValue_valueId_fkey" FOREIGN KEY ("valueId") REFERENCES "Value"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_dlCategoryToDLCategory" ADD FOREIGN KEY ("A") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_dlCategoryToDLCategory" ADD FOREIGN KEY ("B") REFERENCES "DriversLicenseCategoryValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_dlPilotCategoryToDLCategory" ADD FOREIGN KEY ("A") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_dlPilotCategoryToDLCategory" ADD FOREIGN KEY ("B") REFERENCES "DriversLicenseCategoryValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
