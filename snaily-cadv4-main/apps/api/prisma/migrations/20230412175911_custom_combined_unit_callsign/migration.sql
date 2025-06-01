-- AlterEnum
ALTER TYPE "Feature" ADD VALUE 'USER_DEFINED_CALLSIGN_COMBINED_UNIT';

-- AlterTable
ALTER TABLE "CombinedEmsFdUnit" ADD COLUMN     "userDefinedCallsign" TEXT;

-- AlterTable
ALTER TABLE "CombinedLeoUnit" ADD COLUMN     "userDefinedCallsign" TEXT;
