-- CreateEnum
CREATE TYPE "TableActionsAlignment" AS ENUM ('NONE', 'LEFT', 'RIGHT');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "tableActionsAlignment" "TableActionsAlignment" NOT NULL DEFAULT E'RIGHT';
