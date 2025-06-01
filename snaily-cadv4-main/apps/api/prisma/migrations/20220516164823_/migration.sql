-- CreateTable
CREATE TABLE "CourtEntry" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "descriptionData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourtEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourtDate" (
    "id" TEXT NOT NULL,
    "note" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "courtEntryId" TEXT NOT NULL,

    CONSTRAINT "CourtDate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CourtDate" ADD CONSTRAINT "CourtDate_courtEntryId_fkey" FOREIGN KEY ("courtEntryId") REFERENCES "CourtEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
