-- AlterEnum
ALTER TYPE "ValueType" ADD VALUE 'ADDRESS_FLAG';

-- CreateTable
CREATE TABLE "_citizenAddressFlags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_citizenAddressFlags_AB_unique" ON "_citizenAddressFlags"("A", "B");

-- CreateIndex
CREATE INDEX "_citizenAddressFlags_B_index" ON "_citizenAddressFlags"("B");

-- AddForeignKey
ALTER TABLE "_citizenAddressFlags" ADD CONSTRAINT "_citizenAddressFlags_A_fkey" FOREIGN KEY ("A") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_citizenAddressFlags" ADD CONSTRAINT "_citizenAddressFlags_B_fkey" FOREIGN KEY ("B") REFERENCES "Value"("id") ON DELETE CASCADE ON UPDATE CASCADE;
