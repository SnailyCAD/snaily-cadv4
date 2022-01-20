-- AlterTable
ALTER TABLE "Bolo" ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Call911" ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "LeoIncident" ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PenalCode" ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "TaxiCall" ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "TowCall" ALTER COLUMN "description" DROP NOT NULL;
