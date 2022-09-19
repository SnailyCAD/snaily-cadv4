-- AlterEnum
ALTER TYPE "Feature" ADD VALUE 'WARRANT_STATUS_APPROVAL';

-- AlterTable
ALTER TABLE "Warrant" ADD COLUMN     "approvalStatus" "WhitelistStatus" DEFAULT 'ACCEPTED';
