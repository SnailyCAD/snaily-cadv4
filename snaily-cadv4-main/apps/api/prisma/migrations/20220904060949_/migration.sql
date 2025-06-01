-- AlterTable
ALTER TABLE "Call911" ADD COLUMN     "gtaMapPositionId" TEXT;

-- CreateTable
CREATE TABLE "GTAMapPosition" (
    "id" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "z" DOUBLE PRECISION NOT NULL,
    "heading" INTEGER NOT NULL,

    CONSTRAINT "GTAMapPosition_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Call911" ADD CONSTRAINT "Call911_gtaMapPositionId_fkey" FOREIGN KEY ("gtaMapPositionId") REFERENCES "GTAMapPosition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
