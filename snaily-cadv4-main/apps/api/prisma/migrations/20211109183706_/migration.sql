-- DropForeignKey
ALTER TABLE "Officer" DROP CONSTRAINT "Officer_citizenId_fkey";

-- AddForeignKey
ALTER TABLE "Officer" ADD CONSTRAINT "Officer_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;
