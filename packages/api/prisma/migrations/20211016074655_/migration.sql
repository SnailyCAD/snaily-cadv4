-- DropForeignKey
ALTER TABLE "Officer" DROP CONSTRAINT "Officer_rankId_fkey";

-- DropForeignKey
ALTER TABLE "StatusValue" DROP CONSTRAINT "StatusValue_valueId_fkey";

-- AlterTable
ALTER TABLE "Officer" ALTER COLUMN "rankId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Officer" ADD CONSTRAINT "Officer_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "Value"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusValue" ADD CONSTRAINT "StatusValue_valueId_fkey" FOREIGN KEY ("valueId") REFERENCES "Value"("id") ON DELETE CASCADE ON UPDATE CASCADE;
