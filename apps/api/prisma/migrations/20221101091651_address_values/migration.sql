-- AlterEnum
ALTER TYPE "ValueType" ADD VALUE 'ADDRESS';

-- CreateTable
CREATE TABLE "AddressValue" (
    "id" TEXT NOT NULL,
    "valueId" TEXT NOT NULL,
    "county" TEXT,
    "postal" TEXT,

    CONSTRAINT "AddressValue_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AddressValue" ADD CONSTRAINT "AddressValue_valueId_fkey" FOREIGN KEY ("valueId") REFERENCES "Value"("id") ON DELETE CASCADE ON UPDATE CASCADE;
