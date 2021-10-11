-- CreateEnum
CREATE TYPE "Feature" AS ENUM ('BLEETER', 'TOW', 'TAXI', 'COURTHOUSE');

-- AlterTable
ALTER TABLE "cad" ADD COLUMN     "disabledFeatures" "Feature"[];
