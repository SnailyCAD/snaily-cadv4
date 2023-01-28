-- AlterTable
ALTER TABLE "AssignedUnit" ADD COLUMN     "combinedEmsFdId" TEXT;

-- AlterTable
ALTER TABLE "EmsFdDeputy" ADD COLUMN     "combinedEmsFdUnitId" TEXT;

-- AlterTable
ALTER TABLE "IncidentInvolvedUnit" ADD COLUMN     "combinedEmsFdId" TEXT;

-- CreateTable
CREATE TABLE "CombinedEmsFdUnit" (
    "id" TEXT NOT NULL,
    "callsign" TEXT NOT NULL,
    "callsign2" TEXT,
    "departmentId" TEXT,
    "incremental" INTEGER,
    "radioChannelId" TEXT,
    "statusId" TEXT,
    "pairedUnitTemplate" TEXT,
    "activeCallId" TEXT,
    "activeIncidentId" TEXT,
    "lastStatusChangeTimestamp" TIMESTAMP(3),
    "activeVehicleId" TEXT,

    CONSTRAINT "CombinedEmsFdUnit_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CombinedEmsFdUnit" ADD CONSTRAINT "CombinedEmsFdUnit_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "DepartmentValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombinedEmsFdUnit" ADD CONSTRAINT "CombinedEmsFdUnit_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "StatusValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombinedEmsFdUnit" ADD CONSTRAINT "CombinedEmsFdUnit_activeCallId_fkey" FOREIGN KEY ("activeCallId") REFERENCES "Call911"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombinedEmsFdUnit" ADD CONSTRAINT "CombinedEmsFdUnit_activeIncidentId_fkey" FOREIGN KEY ("activeIncidentId") REFERENCES "LeoIncident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombinedEmsFdUnit" ADD CONSTRAINT "CombinedEmsFdUnit_activeVehicleId_fkey" FOREIGN KEY ("activeVehicleId") REFERENCES "EmergencyVehicleValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignedUnit" ADD CONSTRAINT "AssignedUnit_combinedEmsFdId_fkey" FOREIGN KEY ("combinedEmsFdId") REFERENCES "CombinedEmsFdUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentInvolvedUnit" ADD CONSTRAINT "IncidentInvolvedUnit_combinedEmsFdId_fkey" FOREIGN KEY ("combinedEmsFdId") REFERENCES "CombinedEmsFdUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmsFdDeputy" ADD CONSTRAINT "EmsFdDeputy_combinedEmsFdUnitId_fkey" FOREIGN KEY ("combinedEmsFdUnitId") REFERENCES "CombinedEmsFdUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
