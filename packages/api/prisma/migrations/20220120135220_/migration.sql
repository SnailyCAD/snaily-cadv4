-- AlterTable
ALTER TABLE "BleeterPost" ADD COLUMN     "bodyData" JSONB,
ALTER COLUMN "body" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Bolo" ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "BusinessPost" ADD COLUMN     "bodyData" JSONB,
ALTER COLUMN "body" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Call911" ADD COLUMN     "descriptionData" JSONB,
ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "LeoIncident" ADD COLUMN     "descriptionData" JSONB,
ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PenalCode" ADD COLUMN     "descriptionData" JSONB,
ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "TaxiCall" ADD COLUMN     "descriptionData" JSONB,
ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "TowCall" ADD COLUMN     "descriptionData" JSONB,
ALTER COLUMN "description" DROP NOT NULL;
