-- AlterTable
ALTER TABLE "RegisteredVehicle" ADD COLUMN     "impounded" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "TowCall" ADD COLUMN     "callCountyService" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deliveryAddress" VARCHAR(255),
ADD COLUMN     "ended" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "model" VARCHAR(255),
ADD COLUMN     "plate" VARCHAR(255);
