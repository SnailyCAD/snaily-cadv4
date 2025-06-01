-- AlterEnum
ALTER TYPE "ValueType" ADD VALUE 'WEAPON_FLAG';

-- CreateTable
CREATE TABLE "_weaponFlags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_weaponFlags_AB_unique" ON "_weaponFlags"("A", "B");

-- CreateIndex
CREATE INDEX "_weaponFlags_B_index" ON "_weaponFlags"("B");

-- AddForeignKey
ALTER TABLE "_weaponFlags" ADD CONSTRAINT "_weaponFlags_A_fkey" FOREIGN KEY ("A") REFERENCES "Value"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_weaponFlags" ADD CONSTRAINT "_weaponFlags_B_fkey" FOREIGN KEY ("B") REFERENCES "Weapon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
