-- AlterEnum
ALTER TYPE "Feature" ADD VALUE 'DIVISIONS';

-- DropForeignKey
ALTER TABLE "EmsFdDeputy" DROP CONSTRAINT "EmsFdDeputy_divisionId_fkey";

-- DropForeignKey
ALTER TABLE "IndividualDivisionCallsign" DROP CONSTRAINT "IndividualDivisionCallsign_divisionId_fkey";

-- AlterTable
ALTER TABLE "EmsFdDeputy" ALTER COLUMN "divisionId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "IndividualDivisionCallsign" ALTER COLUMN "divisionId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "IndividualDivisionCallsign" ADD CONSTRAINT "IndividualDivisionCallsign_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "DivisionValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmsFdDeputy" ADD CONSTRAINT "EmsFdDeputy_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "DivisionValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
