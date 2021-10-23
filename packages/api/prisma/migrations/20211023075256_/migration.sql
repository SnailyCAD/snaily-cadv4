-- DropForeignKey
ALTER TABLE "TowCall" DROP CONSTRAINT "TowCall_creatorId_fkey";

-- AlterTable
ALTER TABLE "TowCall" ALTER COLUMN "creatorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "TowCall" ADD CONSTRAINT "TowCall_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;
