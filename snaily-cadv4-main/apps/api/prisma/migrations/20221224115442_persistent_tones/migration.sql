-- CreateEnum
CREATE TYPE "ActiveToneType" AS ENUM ('LEO', 'EMS_FD', 'SHARED');

-- CreateTable
CREATE TABLE "ActiveTone" (
    "id" TEXT NOT NULL,
    "type" "ActiveToneType" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "ActiveTone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ActiveTone_type_key" ON "ActiveTone"("type");

-- AddForeignKey
ALTER TABLE "ActiveTone" ADD CONSTRAINT "ActiveTone_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
