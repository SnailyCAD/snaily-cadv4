-- AlterEnum
ALTER TYPE "ValueType" ADD VALUE 'CALL_TYPE';

-- AlterTable
ALTER TABLE "Call911" ADD COLUMN     "typeId" TEXT;

-- CreateTable
CREATE TABLE "CallTypeValue" (
    "id" TEXT NOT NULL,
    "priority" INTEGER,
    "valueId" TEXT NOT NULL,

    CONSTRAINT "CallTypeValue_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CallTypeValue" ADD CONSTRAINT "CallTypeValue_valueId_fkey" FOREIGN KEY ("valueId") REFERENCES "Value"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call911" ADD CONSTRAINT "Call911_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "CallTypeValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
