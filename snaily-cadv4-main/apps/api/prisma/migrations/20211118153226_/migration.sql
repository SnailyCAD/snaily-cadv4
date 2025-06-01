-- AlterTable
ALTER TABLE "AssignedUnit" ADD COLUMN     "combinedLeoId" TEXT;

-- AlterTable
ALTER TABLE "Officer" ADD COLUMN     "combinedLeoUnitId" TEXT;

-- CreateTable
CREATE TABLE "CombinedLeoUnit" (
    "id" TEXT NOT NULL,
    "callsign" TEXT NOT NULL,
    "statusId" TEXT,

    CONSTRAINT "CombinedLeoUnit_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Officer" ADD CONSTRAINT "Officer_combinedLeoUnitId_fkey" FOREIGN KEY ("combinedLeoUnitId") REFERENCES "CombinedLeoUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombinedLeoUnit" ADD CONSTRAINT "CombinedLeoUnit_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "StatusValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignedUnit" ADD CONSTRAINT "AssignedUnit_combinedLeoId_fkey" FOREIGN KEY ("combinedLeoId") REFERENCES "CombinedLeoUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
