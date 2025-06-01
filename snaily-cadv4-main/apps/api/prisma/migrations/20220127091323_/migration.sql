-- DropForeignKey
ALTER TABLE "Call911" DROP CONSTRAINT "Call911_userId_fkey";

-- DropForeignKey
ALTER TABLE "OfficerLog" DROP CONSTRAINT "OfficerLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "TaxiCall" DROP CONSTRAINT "TaxiCall_userId_fkey";

-- DropForeignKey
ALTER TABLE "TowCall" DROP CONSTRAINT "TowCall_userId_fkey";

-- AlterTable
ALTER TABLE "Call911" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ExpungementRequest" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "OfficerLog" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "RegisteredVehicle" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "TaxiCall" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "TowCall" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Weapon" ALTER COLUMN "userId" DROP NOT NULL;
