-- CreateTable
CREATE TABLE "LeoIncident" (
    "id" TEXT NOT NULL,
    "caseNumber" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "firearmsInvolved" BOOLEAN NOT NULL DEFAULT false,
    "injuriesOrFatalities" BOOLEAN NOT NULL DEFAULT false,
    "arrestsMade" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeoIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_involvedOfficers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_involvedOfficers_AB_unique" ON "_involvedOfficers"("A", "B");

-- CreateIndex
CREATE INDEX "_involvedOfficers_B_index" ON "_involvedOfficers"("B");

-- AddForeignKey
ALTER TABLE "LeoIncident" ADD CONSTRAINT "LeoIncident_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Officer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_involvedOfficers" ADD FOREIGN KEY ("A") REFERENCES "LeoIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_involvedOfficers" ADD FOREIGN KEY ("B") REFERENCES "Officer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
