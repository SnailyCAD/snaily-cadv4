-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ShouldDoType" ADD VALUE 'EN_ROUTE';
ALTER TYPE "ShouldDoType" ADD VALUE 'ON_SCENE';

-- AlterTable
ALTER TABLE "Call911Event" ADD COLUMN     "translationData" JSONB;
