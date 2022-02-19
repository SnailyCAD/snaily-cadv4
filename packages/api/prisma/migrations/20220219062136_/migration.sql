-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Feature" ADD VALUE 'DISALLOW_REGULAR_LOGIN';
ALTER TYPE "Feature" ADD VALUE 'DISCORD_ONLY_AUTH';
ALTER TYPE "Feature" ADD VALUE 'ALLOW_REGULAR_LOGIN';
