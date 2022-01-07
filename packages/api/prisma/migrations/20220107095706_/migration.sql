-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "status" "WhitelistStatus" NOT NULL DEFAULT E'PENDING';

-- AlterTable
ALTER TABLE "cad" ADD COLUMN     "businessWhitelisted" BOOLEAN NOT NULL DEFAULT false;
