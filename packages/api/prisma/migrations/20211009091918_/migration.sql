-- AlterTable
ALTER TABLE "cad" ADD COLUMN     "liveMapSocketURl" VARCHAR(255),
ADD COLUMN     "maxPlateLength" INTEGER NOT NULL DEFAULT 8;
