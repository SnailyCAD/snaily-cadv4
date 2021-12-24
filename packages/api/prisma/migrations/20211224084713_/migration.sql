-- AlterTable
ALTER TABLE "Violation" ADD COLUMN     "recordsId" TEXT;

-- AddForeignKey
ALTER TABLE "Violation" ADD FOREIGN KEY ("recordsId") REFERENCES "Record"("id") ON DELETE SET NULL ON UPDATE CASCADE;
