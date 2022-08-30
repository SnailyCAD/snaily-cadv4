-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PAID', 'UNPAID');

-- AlterTable
ALTER TABLE "Record" ADD COLUMN     "paymentStatus" "PaymentStatus";
