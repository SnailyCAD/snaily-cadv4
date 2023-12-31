-- CreateEnum
CREATE TYPE "PublishStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- AlterTable
ALTER TABLE "Record" ADD COLUMN     "publishStatus" "PublishStatus" NOT NULL DEFAULT 'DRAFT';
