-- CreateEnum
CREATE TYPE "ExpungementRequestStatus" AS ENUM ('ACCEPTED', 'DENIED', 'PENDING');

-- AlterTable
ALTER TABLE "ExpungementRequest" ADD COLUMN     "status" "ExpungementRequestStatus" NOT NULL DEFAULT E'PENDING';
