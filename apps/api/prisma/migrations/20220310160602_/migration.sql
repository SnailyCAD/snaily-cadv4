-- AlterEnum
ALTER TYPE "ValueType" ADD VALUE 'CITIZEN_FLAG';

-- CreateTable
CREATE TABLE "_citizenFlags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_citizenFlags_AB_unique" ON "_citizenFlags"("A", "B");

-- CreateIndex
CREATE INDEX "_citizenFlags_B_index" ON "_citizenFlags"("B");

-- AddForeignKey
ALTER TABLE "_citizenFlags" ADD FOREIGN KEY ("A") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_citizenFlags" ADD FOREIGN KEY ("B") REFERENCES "Value"("id") ON DELETE CASCADE ON UPDATE CASCADE;
