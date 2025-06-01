-- AlterTable
ALTER TABLE "MiscCadSettings" ADD COLUMN     "call911InactivityTimeout" INTEGER,
ADD COLUMN     "incidentInactivityTimeout" INTEGER,
ADD COLUMN     "unitInactivityTimeout" INTEGER;
