-- CreateTable
CREATE TABLE "IndividualDivisionCallsign" (
    "id" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "callsign" TEXT NOT NULL,
    "callsign2" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,

    CONSTRAINT "IndividualDivisionCallsign_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "IndividualDivisionCallsign" ADD CONSTRAINT "IndividualDivisionCallsign_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "DivisionValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndividualDivisionCallsign" ADD CONSTRAINT "IndividualDivisionCallsign_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
