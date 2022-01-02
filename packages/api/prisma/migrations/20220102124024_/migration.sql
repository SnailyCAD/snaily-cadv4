-- AlterTable
ALTER TABLE "Record" ADD COLUMN     "expungementRequestId" TEXT;

-- AlterTable
ALTER TABLE "Warrant" ADD COLUMN     "expungementRequestId" TEXT;

-- CreateTable
CREATE TABLE "ExpungementRequest" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,

    CONSTRAINT "ExpungementRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_expungementRequestId_fkey" FOREIGN KEY ("expungementRequestId") REFERENCES "ExpungementRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warrant" ADD CONSTRAINT "Warrant_expungementRequestId_fkey" FOREIGN KEY ("expungementRequestId") REFERENCES "ExpungementRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpungementRequest" ADD CONSTRAINT "ExpungementRequest_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;
