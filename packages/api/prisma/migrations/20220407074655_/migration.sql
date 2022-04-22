-- AlterEnum
ALTER TYPE "Feature" ADD VALUE 'DMV';

-- AlterTable
ALTER TABLE "RegisteredVehicle" ADD COLUMN     "dmvStatus" "WhitelistStatus";
