-- AlterEnum
ALTER TYPE "ValueType" ADD VALUE 'QUALIFICATION';

-- CreateTable
CREATE TABLE "UnitQualification" (
    "id" TEXT NOT NULL,
    "qualificationId" TEXT NOT NULL,
    "suspendedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "officerId" TEXT,
    "emsFdDeputyId" TEXT,

    CONSTRAINT "UnitQualification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualificationValue" (
    "id" TEXT NOT NULL,
    "imageId" TEXT,
    "valueId" TEXT NOT NULL,
    "departmentId" TEXT,

    CONSTRAINT "QualificationValue_pkey" PRIMARY KEY ("id")
);

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
ALTER TABLE "UnitQualification" ADD CONSTRAINT "UnitQualification_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitQualification" ADD CONSTRAINT "UnitQualification_qualificationId_fkey" FOREIGN KEY ("qualificationId") REFERENCES "QualificationValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitQualification" ADD CONSTRAINT "UnitQualification_emsFdDeputyId_fkey" FOREIGN KEY ("emsFdDeputyId") REFERENCES "EmsFdDeputy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualificationValue" ADD CONSTRAINT "QualificationValue_valueId_fkey" FOREIGN KEY ("valueId") REFERENCES "Value"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DepartmentValueToQualificationValue" ADD FOREIGN KEY ("A") REFERENCES "DepartmentValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DepartmentValueToQualificationValue" ADD FOREIGN KEY ("B") REFERENCES "QualificationValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
