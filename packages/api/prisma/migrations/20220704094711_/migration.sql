-- AlterEnum
ALTER TYPE "Feature" ADD VALUE 'ACTIVE_WARRANTS';

-- CreateTable
CREATE TABLE "AssignedWarrantOfficer" (
    "id" TEXT NOT NULL,
    "officerId" TEXT,
    "combinedLeoId" TEXT,
    "warrantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssignedWarrantOfficer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AssignedWarrantOfficer" ADD CONSTRAINT "AssignedWarrantOfficer_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignedWarrantOfficer" ADD CONSTRAINT "AssignedWarrantOfficer_combinedLeoId_fkey" FOREIGN KEY ("combinedLeoId") REFERENCES "CombinedLeoUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignedWarrantOfficer" ADD CONSTRAINT "AssignedWarrantOfficer_warrantId_fkey" FOREIGN KEY ("warrantId") REFERENCES "Warrant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
