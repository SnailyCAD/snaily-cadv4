-- AlterTable
ALTER TABLE "PenalCode" ADD COLUMN     "groupId" TEXT,
ADD COLUMN     "position" INTEGER;

-- CreateTable
CREATE TABLE "PenalCodeGroup" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "PenalCodeGroup_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PenalCode" ADD CONSTRAINT "PenalCode_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "PenalCodeGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
