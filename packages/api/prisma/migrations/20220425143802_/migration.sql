-- AlterEnum
ALTER TYPE "ValueType" ADD VALUE 'QUALIFICATION';

-- CreateTable
CREATE TABLE "UnitQualification" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "suspendedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "officerId" TEXT,
    "emsFdDeputyId" TEXT,

    CONSTRAINT "UnitQualification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualificationValue" (
    "id" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "valueId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,

    CONSTRAINT "QualificationValue_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UnitQualification" ADD CONSTRAINT "UnitQualification_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "DepartmentValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitQualification" ADD CONSTRAINT "UnitQualification_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitQualification" ADD CONSTRAINT "UnitQualification_emsFdDeputyId_fkey" FOREIGN KEY ("emsFdDeputyId") REFERENCES "EmsFdDeputy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualificationValue" ADD CONSTRAINT "QualificationValue_valueId_fkey" FOREIGN KEY ("valueId") REFERENCES "Value"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualificationValue" ADD CONSTRAINT "QualificationValue_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "DepartmentValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
