-- DropForeignKey
ALTER TABLE "RecordLog" DROP CONSTRAINT "RecordLog_recordId_fkey";

-- DropForeignKey
ALTER TABLE "RecordLog" DROP CONSTRAINT "RecordLog_warrantId_fkey";

-- AlterTable
ALTER TABLE "RecordLog" ALTER COLUMN "recordId" DROP NOT NULL,
ALTER COLUMN "warrantId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "RecordLog" ADD CONSTRAINT "RecordLog_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "Record"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordLog" ADD CONSTRAINT "RecordLog_warrantId_fkey" FOREIGN KEY ("warrantId") REFERENCES "Warrant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
