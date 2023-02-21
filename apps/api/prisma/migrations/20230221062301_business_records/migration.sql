-- AlterTable
ALTER TABLE "Record" ADD COLUMN     "businessId" TEXT,
ALTER COLUMN "citizenId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;
