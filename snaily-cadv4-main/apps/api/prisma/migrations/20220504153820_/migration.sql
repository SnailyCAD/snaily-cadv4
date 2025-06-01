-- AlterEnum
ALTER TYPE "Feature" ADD VALUE 'CITIZEN_RECORD_APPROVAL';

-- AlterTable
ALTER TABLE "Record" ADD COLUMN     "status" "WhitelistStatus" DEFAULT E'ACCEPTED';
