-- CreateEnum
CREATE TYPE "PenalCodeType" AS ENUM ('INFRACTION', 'MISDEMEANOR', 'FELONY');

-- AlterTable
ALTER TABLE "PenalCode" ADD COLUMN     "type" "PenalCodeType";
