-- AlterTable
ALTER TABLE "MiscCadSettings" ALTER COLUMN "pairedUnitSymbol" DROP NOT NULL,
ALTER COLUMN "pairedUnitTemplate" SET DEFAULT E'1A-{callsign2}';
