-- CreateTable
CREATE TABLE "_CustomFieldValueToRegisteredVehicle" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_CustomFieldValueToWeapon" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CustomFieldValueToRegisteredVehicle_AB_unique" ON "_CustomFieldValueToRegisteredVehicle"("A", "B");

-- CreateIndex
CREATE INDEX "_CustomFieldValueToRegisteredVehicle_B_index" ON "_CustomFieldValueToRegisteredVehicle"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CustomFieldValueToWeapon_AB_unique" ON "_CustomFieldValueToWeapon"("A", "B");

-- CreateIndex
CREATE INDEX "_CustomFieldValueToWeapon_B_index" ON "_CustomFieldValueToWeapon"("B");

-- AddForeignKey
ALTER TABLE "_CustomFieldValueToRegisteredVehicle" ADD FOREIGN KEY ("A") REFERENCES "CustomFieldValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CustomFieldValueToRegisteredVehicle" ADD FOREIGN KEY ("B") REFERENCES "RegisteredVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CustomFieldValueToWeapon" ADD FOREIGN KEY ("A") REFERENCES "CustomFieldValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CustomFieldValueToWeapon" ADD FOREIGN KEY ("B") REFERENCES "Weapon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
