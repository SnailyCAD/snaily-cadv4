-- CreateTable
CREATE TABLE "TaxiCall" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "assignedUnitId" TEXT,
    "location" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "creatorId" TEXT,

    CONSTRAINT "TaxiCall_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TaxiCall" ADD CONSTRAINT "TaxiCall_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxiCall" ADD CONSTRAINT "TaxiCall_assignedUnitId_fkey" FOREIGN KEY ("assignedUnitId") REFERENCES "Citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxiCall" ADD CONSTRAINT "TaxiCall_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;
