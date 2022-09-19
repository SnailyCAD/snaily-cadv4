-- AlterTable
ALTER TABLE "Call911" ADD COLUMN     "positionId" TEXT;

-- AlterTable
ALTER TABLE "MiscCadSettings" ADD COLUMN     "liveMapURL" TEXT;

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Call911" ADD CONSTRAINT "Call911_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;
