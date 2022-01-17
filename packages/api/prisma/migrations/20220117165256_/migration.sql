-- CreateTable
CREATE TABLE "_BusinessToRegisteredVehicle" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_BusinessToRegisteredVehicle_AB_unique" ON "_BusinessToRegisteredVehicle"("A", "B");

-- CreateIndex
CREATE INDEX "_BusinessToRegisteredVehicle_B_index" ON "_BusinessToRegisteredVehicle"("B");

-- AddForeignKey
ALTER TABLE "_BusinessToRegisteredVehicle" ADD FOREIGN KEY ("A") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BusinessToRegisteredVehicle" ADD FOREIGN KEY ("B") REFERENCES "RegisteredVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
