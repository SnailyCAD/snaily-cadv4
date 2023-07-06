-- AlterTable
ALTER TABLE "MiscCadSettings" ADD COLUMN     "signal100RepeatAmount" INTEGER DEFAULT 1,
ADD COLUMN     "signal100RepeatIntervalMs" INTEGER DEFAULT 1000;
