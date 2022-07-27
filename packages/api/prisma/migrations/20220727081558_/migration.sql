/*
  Warnings:

  - Added the required column `type` to the `AuditLog` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AuditLogType" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "type" "AuditLogType" NOT NULL;
