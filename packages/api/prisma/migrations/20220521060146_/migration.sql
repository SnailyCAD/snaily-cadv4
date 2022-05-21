-- AlterTable
ALTER TABLE "OfficerLog" ADD COLUMN     "emsFdDeputyId" TEXT,
ALTER COLUMN "officerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "OfficerLog" ADD CONSTRAINT "OfficerLog_emsFdDeputyId_fkey" FOREIGN KEY ("emsFdDeputyId") REFERENCES "EmsFdDeputy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
