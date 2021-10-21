-- DropForeignKey
ALTER TABLE "OfficerLog" DROP CONSTRAINT "OfficerLog_officerId_fkey";

-- DropForeignKey
ALTER TABLE "OfficerLog" DROP CONSTRAINT "OfficerLog_userId_fkey";

-- AddForeignKey
ALTER TABLE "OfficerLog" ADD CONSTRAINT "OfficerLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficerLog" ADD CONSTRAINT "OfficerLog_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
