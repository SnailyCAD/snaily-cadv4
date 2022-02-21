-- AlterEnum
ALTER TYPE "Feature" ADD VALUE 'ACTIVE_INCIDENTS';

-- DropForeignKey
ALTER TABLE "LeoIncident" DROP CONSTRAINT "LeoIncident_creatorId_fkey";

-- AlterTable
ALTER TABLE "LeoIncident" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "creatorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "LeoIncident" ADD CONSTRAINT "LeoIncident_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Officer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
