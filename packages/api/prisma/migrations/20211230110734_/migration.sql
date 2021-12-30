-- CreateTable
CREATE TABLE "RecordLog" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "warrantId" TEXT NOT NULL,

    CONSTRAINT "RecordLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RecordLog" ADD CONSTRAINT "RecordLog_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordLog" ADD CONSTRAINT "RecordLog_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "Record"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordLog" ADD CONSTRAINT "RecordLog_warrantId_fkey" FOREIGN KEY ("warrantId") REFERENCES "Warrant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
