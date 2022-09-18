-- CreateTable
CREATE TABLE "_registeredBusinessVehicles" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_registeredBusinessVehicles_AB_unique" ON "_registeredBusinessVehicles"("A", "B");

-- CreateIndex
CREATE INDEX "_registeredBusinessVehicles_B_index" ON "_registeredBusinessVehicles"("B");

-- AddForeignKey
ALTER TABLE "_registeredBusinessVehicles" ADD FOREIGN KEY ("A") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_registeredBusinessVehicles" ADD FOREIGN KEY ("B") REFERENCES "RegisteredVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
