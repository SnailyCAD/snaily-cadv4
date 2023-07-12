-- DropForeignKey
ALTER TABLE "Record" DROP CONSTRAINT "Record_officerId_fkey";

-- DropForeignKey
ALTER TABLE "RecordLog" DROP CONSTRAINT "RecordLog_recordId_fkey";

-- DropForeignKey
ALTER TABLE "RecordLog" DROP CONSTRAINT "RecordLog_warrantId_fkey";

-- DropForeignKey
ALTER TABLE "Warrant" DROP CONSTRAINT "Warrant_officerId_fkey";

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warrant" ADD CONSTRAINT "Warrant_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordLog" ADD CONSTRAINT "RecordLog_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "Record"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordLog" ADD CONSTRAINT "RecordLog_warrantId_fkey" FOREIGN KEY ("warrantId") REFERENCES "Warrant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
