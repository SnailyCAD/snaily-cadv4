-- CreateEnum
CREATE TYPE "StatusValueType" AS ENUM ('STATUS_CODE', 'SITUATION_CODE');

-- AlterTable
ALTER TABLE "StatusValue" ADD COLUMN     "type" "StatusValueType" NOT NULL DEFAULT E'STATUS_CODE';
