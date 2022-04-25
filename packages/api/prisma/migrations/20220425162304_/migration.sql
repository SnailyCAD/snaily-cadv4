-- DropForeignKey
ALTER TABLE "QualificationValue" DROP CONSTRAINT "QualificationValue_departmentId_fkey";

-- AlterTable
ALTER TABLE "QualificationValue" ALTER COLUMN "departmentId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "_DepartmentValueToQualificationValue" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_DepartmentValueToQualificationValue_AB_unique" ON "_DepartmentValueToQualificationValue"("A", "B");

-- CreateIndex
CREATE INDEX "_DepartmentValueToQualificationValue_B_index" ON "_DepartmentValueToQualificationValue"("B");

-- AddForeignKey
ALTER TABLE "_DepartmentValueToQualificationValue" ADD FOREIGN KEY ("A") REFERENCES "DepartmentValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DepartmentValueToQualificationValue" ADD FOREIGN KEY ("B") REFERENCES "QualificationValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
