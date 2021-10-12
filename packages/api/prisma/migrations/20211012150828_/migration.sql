-- AlterEnum
ALTER TYPE "ValueType" ADD VALUE 'BUSINESS_ROLE';

-- AlterTable
ALTER TABLE "Business" ALTER COLUMN "whitelisted" SET DEFAULT false;
