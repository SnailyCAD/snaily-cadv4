-- AlterEnum
ALTER TYPE "Feature" ADD VALUE 'DISCORD_AUTH';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "discordId" TEXT;
