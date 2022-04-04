-- CreateEnum
CREATE TYPE "CustomFieldCategory" AS ENUM ('CITIZEN', 'WEAPON', 'VEHICLE');

-- CreateTable
CREATE TABLE "CustomField" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "citizenEditable" BOOLEAN NOT NULL DEFAULT false,
    "category" "CustomFieldCategory" NOT NULL,

    CONSTRAINT "CustomField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomFieldValue" (
    "id" TEXT NOT NULL,
    "value" TEXT,
    "fieldId" TEXT NOT NULL,

    CONSTRAINT "CustomFieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CitizenToCustomFieldValue" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

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
CREATE UNIQUE INDEX "_CitizenToCustomFieldValue_AB_unique" ON "_CitizenToCustomFieldValue"("A", "B");

-- CreateIndex
CREATE INDEX "_CitizenToCustomFieldValue_B_index" ON "_CitizenToCustomFieldValue"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CustomFieldValueToRegisteredVehicle_AB_unique" ON "_CustomFieldValueToRegisteredVehicle"("A", "B");

-- CreateIndex
CREATE INDEX "_CustomFieldValueToRegisteredVehicle_B_index" ON "_CustomFieldValueToRegisteredVehicle"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CustomFieldValueToWeapon_AB_unique" ON "_CustomFieldValueToWeapon"("A", "B");

-- CreateIndex
CREATE INDEX "_CustomFieldValueToWeapon_B_index" ON "_CustomFieldValueToWeapon"("B");

-- AddForeignKey
ALTER TABLE "CustomFieldValue" ADD CONSTRAINT "CustomFieldValue_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "CustomField"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CitizenToCustomFieldValue" ADD FOREIGN KEY ("A") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CitizenToCustomFieldValue" ADD FOREIGN KEY ("B") REFERENCES "CustomFieldValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CustomFieldValueToRegisteredVehicle" ADD FOREIGN KEY ("A") REFERENCES "CustomFieldValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CustomFieldValueToRegisteredVehicle" ADD FOREIGN KEY ("B") REFERENCES "RegisteredVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CustomFieldValueToWeapon" ADD FOREIGN KEY ("A") REFERENCES "CustomFieldValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CustomFieldValueToWeapon" ADD FOREIGN KEY ("B") REFERENCES "Weapon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
