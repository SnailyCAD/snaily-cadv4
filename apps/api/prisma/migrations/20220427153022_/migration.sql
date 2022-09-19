-- CreateEnum
CREATE TYPE "QualificationValueType" AS ENUM ('QUALIFICATION', 'AWARD');

-- AlterTable
ALTER TABLE "QualificationValue" ADD COLUMN     "qualificationType" "QualificationValueType" NOT NULL DEFAULT E'QUALIFICATION';
