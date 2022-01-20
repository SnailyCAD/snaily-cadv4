-- AlterTable
ALTER TABLE "Bolo" ADD COLUMN     "descriptionData" JSONB;

-- AlterTable
ALTER TABLE "Call911" ADD COLUMN     "descriptionData" JSONB;

-- AlterTable
ALTER TABLE "LeoIncident" ADD COLUMN     "descriptionData" JSONB;

-- AlterTable
ALTER TABLE "PenalCode" ADD COLUMN     "descriptionData" JSONB;

-- AlterTable
ALTER TABLE "TaxiCall" ADD COLUMN     "descriptionData" JSONB;

-- AlterTable
ALTER TABLE "TowCall" ADD COLUMN     "descriptionData" JSONB;
