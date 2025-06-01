-- AlterTable
ALTER TABLE "Call911" ADD COLUMN     "emsFdIncidentId" TEXT;

-- AlterTable
ALTER TABLE "CombinedEmsFdUnit" ADD COLUMN     "emsFdIncidentId" TEXT;

-- AlterTable
ALTER TABLE "CombinedLeoUnit" ADD COLUMN     "emsFdIncidentId" TEXT;

-- AlterTable
ALTER TABLE "IncidentEvent" ADD COLUMN     "emsFdIncidentId" TEXT;

-- AlterTable
ALTER TABLE "IncidentInvolvedUnit" ADD COLUMN     "emsFdIncidentId" TEXT;

-- AlterTable
ALTER TABLE "Record" ADD COLUMN     "emsFdIncidentId" TEXT;

-- CreateTable
CREATE TABLE "EmsFdIncident" (
    "id" TEXT NOT NULL,
    "caseNumber" SERIAL NOT NULL,
    "description" TEXT,
    "descriptionData" JSONB,
    "postal" TEXT,
    "creatorId" TEXT,
    "firearmsInvolved" BOOLEAN NOT NULL DEFAULT false,
    "injuriesOrFatalities" BOOLEAN NOT NULL DEFAULT false,
    "arrestsMade" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "situationCodeId" TEXT,

    CONSTRAINT "EmsFdIncident_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "IncidentEvent" ADD CONSTRAINT "IncidentEvent_emsFdIncidentId_fkey" FOREIGN KEY ("emsFdIncidentId") REFERENCES "EmsFdIncident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombinedLeoUnit" ADD CONSTRAINT "CombinedLeoUnit_emsFdIncidentId_fkey" FOREIGN KEY ("emsFdIncidentId") REFERENCES "EmsFdIncident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombinedEmsFdUnit" ADD CONSTRAINT "CombinedEmsFdUnit_emsFdIncidentId_fkey" FOREIGN KEY ("emsFdIncidentId") REFERENCES "EmsFdIncident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call911" ADD CONSTRAINT "Call911_emsFdIncidentId_fkey" FOREIGN KEY ("emsFdIncidentId") REFERENCES "EmsFdIncident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentInvolvedUnit" ADD CONSTRAINT "IncidentInvolvedUnit_emsFdIncidentId_fkey" FOREIGN KEY ("emsFdIncidentId") REFERENCES "EmsFdIncident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_emsFdIncidentId_fkey" FOREIGN KEY ("emsFdIncidentId") REFERENCES "EmsFdIncident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmsFdIncident" ADD CONSTRAINT "EmsFdIncident_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "EmsFdDeputy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmsFdIncident" ADD CONSTRAINT "EmsFdIncident_situationCodeId_fkey" FOREIGN KEY ("situationCodeId") REFERENCES "StatusValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
