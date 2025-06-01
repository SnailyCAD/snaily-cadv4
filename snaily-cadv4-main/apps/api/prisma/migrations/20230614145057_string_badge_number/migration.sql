-- AlterTable
ALTER TABLE "EmsFdDeputy" ADD COLUMN     "badgeNumberString" TEXT;

-- AlterTable
ALTER TABLE "Officer" ADD COLUMN     "badgeNumberString" TEXT;

-- Migrate all officers and deputies
UPDATE "Officer" SET "badgeNumberString" = "badgeNumber"::TEXT;

UPDATE "EmsFdDeputy" SET "badgeNumberString" = "badgeNumber"::TEXT;