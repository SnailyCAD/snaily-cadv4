-- AlterEnum
ALTER TYPE "Feature" ADD VALUE 'CALL_911_APPROVAL';

-- AlterTable
ALTER TABLE "Call911" ADD COLUMN     "status" "WhitelistStatus";
