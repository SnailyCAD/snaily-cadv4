-- AlterEnum
ALTER TYPE "Feature" ADD VALUE 'BUREAU_OF_FIREARMS';

-- AlterTable
ALTER TABLE "Weapon" ADD COLUMN     "bofStatus" "WhitelistStatus";
