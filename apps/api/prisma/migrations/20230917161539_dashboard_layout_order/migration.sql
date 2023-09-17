-- CreateEnum
CREATE TYPE "DashboardLayoutCardType" AS ENUM ('ACTIVE_CALLS', 'ACTIVE_BOLOS', 'ACTIVE_WARRANTS', 'ACTIVE_OFFICERS', 'ACTIVE_DEPUTIES', 'ACTIVE_INCIDENTS');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dispatchLayoutOrder" "DashboardLayoutCardType"[],
ADD COLUMN     "emsFdLayoutOrder" "DashboardLayoutCardType"[],
ADD COLUMN     "officerLayoutOrder" "DashboardLayoutCardType"[];
