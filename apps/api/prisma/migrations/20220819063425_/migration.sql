-- DropForeignKey
ALTER TABLE "WeaponExam" DROP CONSTRAINT "WeaponExam_citizenId_fkey";

-- AddForeignKey
ALTER TABLE "WeaponExam" ADD CONSTRAINT "WeaponExam_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;
