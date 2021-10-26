-- DropForeignKey
ALTER TABLE "Officer" DROP CONSTRAINT "Officer_citizenId_fkey";

-- AlterTable
ALTER TABLE "DivisionValue" ADD COLUMN     "callsign" TEXT;

-- AlterTable
ALTER TABLE "MiscCadSettings" ADD COLUMN     "callsignTemplate" TEXT NOT NULL DEFAULT E'{department}{callsign1} - {callsign2}{division}',
ADD COLUMN     "pairedUnitSymbol" VARCHAR(255) NOT NULL DEFAULT E'A';

-- AddForeignKey
ALTER TABLE "Officer" ADD CONSTRAINT "Officer_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;
