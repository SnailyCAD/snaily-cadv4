-- AlterEnum
ALTER TYPE "ValueType" ADD VALUE 'PRIORITY_STATUS';

-- AlterTable
ALTER TABLE "cad" ADD COLUMN     "priorityStatusId" TEXT;

-- CreateTable
CREATE TABLE "PriorityStatusValue" (
    "id" TEXT NOT NULL,
    "valueId" TEXT NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "PriorityStatusValue_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "cad" ADD CONSTRAINT "cad_priorityStatusId_fkey" FOREIGN KEY ("priorityStatusId") REFERENCES "PriorityStatusValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriorityStatusValue" ADD CONSTRAINT "PriorityStatusValue_valueId_fkey" FOREIGN KEY ("valueId") REFERENCES "Value"("id") ON DELETE CASCADE ON UPDATE CASCADE;
