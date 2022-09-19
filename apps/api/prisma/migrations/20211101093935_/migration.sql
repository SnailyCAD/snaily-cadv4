-- AlterTable
ALTER TABLE "MedicalRecord" ADD COLUMN     "bloodGroupId" TEXT,
ALTER COLUMN "type" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_bloodGroupId_fkey" FOREIGN KEY ("bloodGroupId") REFERENCES "Value"("id") ON DELETE SET NULL ON UPDATE CASCADE;
