-- CreateIndex
CREATE INDEX "Bolo_type_plate_name_idx" ON "Bolo"("type", "plate", "name");

-- CreateIndex
CREATE INDEX "Call911_caseNumber_idx" ON "Call911"("caseNumber");

-- CreateIndex
CREATE INDEX "CombinedEmsFdUnit_statusId_idx" ON "CombinedEmsFdUnit"("statusId");

-- CreateIndex
CREATE INDEX "CombinedLeoUnit_statusId_idx" ON "CombinedLeoUnit"("statusId");

-- CreateIndex
CREATE INDEX "EmsFdDeputy_callsign_callsign2_statusId_idx" ON "EmsFdDeputy"("callsign", "callsign2", "statusId");

-- CreateIndex
CREATE INDEX "Officer_callsign_callsign2_statusId_idx" ON "Officer"("callsign", "callsign2", "statusId");

-- CreateIndex
CREATE INDEX "RegisteredVehicle_plate_vinNumber_idx" ON "RegisteredVehicle"("plate", "vinNumber");

-- CreateIndex
CREATE INDEX "Value_type_idx" ON "Value"("type");

-- CreateIndex
CREATE INDEX "Weapon_serialNumber_idx" ON "Weapon"("serialNumber");
