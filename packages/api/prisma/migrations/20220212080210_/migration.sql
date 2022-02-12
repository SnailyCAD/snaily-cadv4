-- DropForeignKey
ALTER TABLE "SeizedItem" DROP CONSTRAINT "SeizedItem_recordId_fkey";

-- AddForeignKey
ALTER TABLE "SeizedItem" ADD CONSTRAINT "SeizedItem_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "Record"("id") ON DELETE CASCADE ON UPDATE CASCADE;
