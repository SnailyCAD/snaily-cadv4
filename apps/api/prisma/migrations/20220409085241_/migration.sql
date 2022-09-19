-- CreateTable
CREATE TABLE "IncidentInvolvedUnit" (
    "id" TEXT NOT NULL,
    "officerId" TEXT,
    "emsFdDeputyId" TEXT,
    "combinedLeoId" TEXT,
    "incidentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentInvolvedUnit_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "IncidentInvolvedUnit" ADD CONSTRAINT "IncidentInvolvedUnit_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentInvolvedUnit" ADD CONSTRAINT "IncidentInvolvedUnit_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "LeoIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentInvolvedUnit" ADD CONSTRAINT "IncidentInvolvedUnit_combinedLeoId_fkey" FOREIGN KEY ("combinedLeoId") REFERENCES "CombinedLeoUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentInvolvedUnit" ADD CONSTRAINT "IncidentInvolvedUnit_emsFdDeputyId_fkey" FOREIGN KEY ("emsFdDeputyId") REFERENCES "EmsFdDeputy"("id") ON DELETE SET NULL ON UPDATE CASCADE;
