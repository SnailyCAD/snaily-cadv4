-- DropForeignKey
ALTER TABLE "DLExam" DROP CONSTRAINT "DLExam_citizenId_fkey";

-- AddForeignKey
ALTER TABLE "DLExam" ADD CONSTRAINT "DLExam_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;
