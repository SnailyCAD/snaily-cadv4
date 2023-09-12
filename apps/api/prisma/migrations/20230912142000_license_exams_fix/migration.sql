-- DropForeignKey
ALTER TABLE "DLExam" DROP CONSTRAINT "DLExam_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "DLExam" DROP CONSTRAINT "DLExam_licenseId_fkey";

-- DropForeignKey
ALTER TABLE "DriversLicenseCategoryValue" DROP CONSTRAINT "DriversLicenseCategoryValue_licenseExamId_fkey";

-- DropForeignKey
ALTER TABLE "WeaponExam" DROP CONSTRAINT "WeaponExam_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "WeaponExam" DROP CONSTRAINT "WeaponExam_licenseId_fkey";

-- DropForeignKey
ALTER TABLE "_DLExamToDriversLicenseCategoryValue" DROP CONSTRAINT "_DLExamToDriversLicenseCategoryValue_A_fkey";

-- DropForeignKey
ALTER TABLE "_DLExamToDriversLicenseCategoryValue" DROP CONSTRAINT "_DLExamToDriversLicenseCategoryValue_B_fkey";

-- DropForeignKey
ALTER TABLE "_DriversLicenseCategoryValueToWeaponExam" DROP CONSTRAINT "_DriversLicenseCategoryValueToWeaponExam_A_fkey";

-- DropForeignKey
ALTER TABLE "_DriversLicenseCategoryValueToWeaponExam" DROP CONSTRAINT "_DriversLicenseCategoryValueToWeaponExam_B_fkey";

-- AlterTable
ALTER TABLE "DriversLicenseCategoryValue" DROP COLUMN "licenseExamId";

-- DropTable
DROP TABLE "DLExam";

-- DropTable
DROP TABLE "WeaponExam";

-- DropTable
DROP TABLE "_DLExamToDriversLicenseCategoryValue";

-- DropTable
DROP TABLE "_DriversLicenseCategoryValueToWeaponExam";

-- CreateTable
CREATE TABLE "_dlCategoryToLicenseExam" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_dlCategoryToLicenseExam_AB_unique" ON "_dlCategoryToLicenseExam"("A", "B");

-- CreateIndex
CREATE INDEX "_dlCategoryToLicenseExam_B_index" ON "_dlCategoryToLicenseExam"("B");

-- AddForeignKey
ALTER TABLE "_dlCategoryToLicenseExam" ADD CONSTRAINT "_dlCategoryToLicenseExam_A_fkey" FOREIGN KEY ("A") REFERENCES "DriversLicenseCategoryValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_dlCategoryToLicenseExam" ADD CONSTRAINT "_dlCategoryToLicenseExam_B_fkey" FOREIGN KEY ("B") REFERENCES "LicenseExam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
