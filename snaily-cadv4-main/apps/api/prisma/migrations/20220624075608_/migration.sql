-- AlterEnum
ALTER TYPE "Feature" ADD VALUE 'WEAPON_EXAMS';

-- CreateTable
CREATE TABLE "WeaponExam" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "theoryExam" "DLExamPassType",
    "practiceExam" "DLExamPassType",
    "licenseId" TEXT NOT NULL,
    "status" "DLExamStatus" NOT NULL DEFAULT E'IN_PROGRESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeaponExam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DriversLicenseCategoryValueToWeaponExam" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_DriversLicenseCategoryValueToWeaponExam_AB_unique" ON "_DriversLicenseCategoryValueToWeaponExam"("A", "B");

-- CreateIndex
CREATE INDEX "_DriversLicenseCategoryValueToWeaponExam_B_index" ON "_DriversLicenseCategoryValueToWeaponExam"("B");

-- AddForeignKey
ALTER TABLE "WeaponExam" ADD CONSTRAINT "WeaponExam_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeaponExam" ADD CONSTRAINT "WeaponExam_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "Value"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DriversLicenseCategoryValueToWeaponExam" ADD CONSTRAINT "_DriversLicenseCategoryValueToWeaponExam_A_fkey" FOREIGN KEY ("A") REFERENCES "DriversLicenseCategoryValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DriversLicenseCategoryValueToWeaponExam" ADD CONSTRAINT "_DriversLicenseCategoryValueToWeaponExam_B_fkey" FOREIGN KEY ("B") REFERENCES "WeaponExam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
