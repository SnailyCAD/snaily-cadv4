-- CreateEnum
CREATE TYPE "CustomFieldCategory" AS ENUM ('CITIZEN', 'WEAPON', 'VEHICLE');

-- CreateTable
CREATE TABLE "CustomField" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT,
    "category" "CustomFieldCategory" NOT NULL,

    CONSTRAINT "CustomField_pkey" PRIMARY KEY ("id")
);
