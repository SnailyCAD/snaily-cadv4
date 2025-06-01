-- DropForeignKey
ALTER TABLE "Citizen" DROP CONSTRAINT "Citizen_ethnicityId_fkey";

-- DropForeignKey
ALTER TABLE "Citizen" DROP CONSTRAINT "Citizen_genderId_fkey";

-- AlterTable
ALTER TABLE "Citizen" ALTER COLUMN "genderId" DROP NOT NULL,
ALTER COLUMN "ethnicityId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "EmsFdDeputy" ADD COLUMN     "identifiers" TEXT[],
ADD COLUMN     "isTemporary" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Officer" ADD COLUMN     "identifiers" TEXT[],
ADD COLUMN     "isTemporary" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "fullname" ON "Citizen"("name", "surname");

-- AddForeignKey
ALTER TABLE "Citizen" ADD CONSTRAINT "Citizen_genderId_fkey" FOREIGN KEY ("genderId") REFERENCES "Value"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Citizen" ADD CONSTRAINT "Citizen_ethnicityId_fkey" FOREIGN KEY ("ethnicityId") REFERENCES "Value"("id") ON DELETE SET NULL ON UPDATE CASCADE;
