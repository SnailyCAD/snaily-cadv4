-- AlterEnum
ALTER TYPE "Feature" ADD VALUE 'ACTIVE_INCIDENTS';

-- DropForeignKey
ALTER TABLE "LeoIncident" DROP CONSTRAINT "LeoIncident_creatorId_fkey";

-- AlterTable
ALTER TABLE "LeoIncident" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "creatorId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Officer" ADD COLUMN     "activeIncidentId" TEXT;

-- AddForeignKey
ALTER TABLE "Officer" ADD CONSTRAINT "Officer_activeIncidentId_fkey" FOREIGN KEY ("activeIncidentId") REFERENCES "LeoIncident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeoIncident" ADD CONSTRAINT "LeoIncident_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Officer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
