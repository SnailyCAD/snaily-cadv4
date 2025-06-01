-- CreateEnum
CREATE TYPE "JailTimeScale" AS ENUM ('HOURS', 'MINUTES', 'SECONDS');

-- AlterTable
ALTER TABLE "MiscCadSettings" ADD COLUMN     "jailTimeScale" "JailTimeScale";
