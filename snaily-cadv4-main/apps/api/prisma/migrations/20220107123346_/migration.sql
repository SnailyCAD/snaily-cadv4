-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "status" "WhitelistStatus";

-- AlterTable
ALTER TABLE "cad" ADD COLUMN     "businessWhitelisted" BOOLEAN NOT NULL DEFAULT false;
