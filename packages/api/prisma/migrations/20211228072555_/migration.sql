-- CreateEnum
CREATE TYPE "ReleaseType" AS ENUM ('TIME_OUT', 'BAIL_POSTED');

-- AlterTable
ALTER TABLE "Record" ADD COLUMN     "releaseId" TEXT;

-- CreateTable
CREATE TABLE "RecordRelease" (
    "id" TEXT NOT NULL,
    "type" "ReleaseType" NOT NULL,
    "citizenId" TEXT,

    CONSTRAINT "RecordRelease_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "RecordRelease"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordRelease" ADD CONSTRAINT "RecordRelease_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;
