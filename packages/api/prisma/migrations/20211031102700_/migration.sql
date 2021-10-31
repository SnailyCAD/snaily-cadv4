-- DropForeignKey
ALTER TABLE "Weapon" DROP CONSTRAINT "Weapon_modelId_fkey";

-- CreateTable
CREATE TABLE "WeaponValue" (
    "id" TEXT NOT NULL,
    "valueId" TEXT NOT NULL,
    "hash" TEXT,

    CONSTRAINT "WeaponValue_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Weapon" ADD CONSTRAINT "Weapon_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "WeaponValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeaponValue" ADD CONSTRAINT "WeaponValue_valueId_fkey" FOREIGN KEY ("valueId") REFERENCES "Value"("id") ON DELETE CASCADE ON UPDATE CASCADE;
