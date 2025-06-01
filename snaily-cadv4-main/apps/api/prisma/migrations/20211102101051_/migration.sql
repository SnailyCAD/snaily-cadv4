-- CreateEnum
CREATE TYPE "StatusViewMode" AS ENUM ('FULL_ROW_COLOR', 'DOT_COLOR');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "statusViewMode" "StatusViewMode" NOT NULL DEFAULT E'DOT_COLOR';
