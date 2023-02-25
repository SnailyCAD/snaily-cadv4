-- AlterTable
ALTER TABLE "RecordLog" ADD COLUMN     "businessId" TEXT,
ALTER COLUMN "citizenId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "RecordLog" ADD CONSTRAINT "RecordLog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;
