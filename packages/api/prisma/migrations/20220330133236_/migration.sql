-- CreateEnum
CREATE TYPE "DLExamPassType" AS ENUM ('PASSED', 'FAILED');

-- CreateEnum
CREATE TYPE "DLExamStatus" AS ENUM ('IN_PROGRESS', 'PASSED', 'FAILED');

-- AlterEnum
ALTER TYPE "Feature" ADD VALUE 'DL_EXAMS';

-- CreateTable
CREATE TABLE "DLExam" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "theoryExam" "DLExamPassType",
    "practiceExam" "DLExamPassType",
    "licenseId" TEXT NOT NULL,
    "status" "DLExamStatus" NOT NULL DEFAULT E'IN_PROGRESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DLExam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DLExamToDriversLicenseCategoryValue" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_DLExamToDriversLicenseCategoryValue_AB_unique" ON "_DLExamToDriversLicenseCategoryValue"("A", "B");

-- CreateIndex
CREATE INDEX "_DLExamToDriversLicenseCategoryValue_B_index" ON "_DLExamToDriversLicenseCategoryValue"("B");

-- AddForeignKey
ALTER TABLE "DLExam" ADD CONSTRAINT "DLExam_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DLExam" ADD CONSTRAINT "DLExam_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "Value"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DLExamToDriversLicenseCategoryValue" ADD FOREIGN KEY ("A") REFERENCES "DLExam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DLExamToDriversLicenseCategoryValue" ADD FOREIGN KEY ("B") REFERENCES "DriversLicenseCategoryValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
