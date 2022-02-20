-- AlterTable
ALTER TABLE "MiscCadSettings" ADD COLUMN     "pairedUnitTemplate" TEXT DEFAULT E'1A-{callsign2}',
ALTER COLUMN "pairedUnitSymbol" DROP NOT NULL;
