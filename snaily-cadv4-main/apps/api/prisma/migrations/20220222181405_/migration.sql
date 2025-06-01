-- AlterEnum
ALTER TYPE "Feature" ADD VALUE 'RADIO_CHANNEL_MANAGEMENT';

-- AlterTable
ALTER TABLE "EmsFdDeputy" ADD COLUMN     "radioChannelId" TEXT;

-- AlterTable
ALTER TABLE "Officer" ADD COLUMN     "radioChannelId" TEXT;
