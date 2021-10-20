-- DropForeignKey
ALTER TABLE "Bolo" DROP CONSTRAINT "Bolo_officerId_fkey";

-- AlterTable
ALTER TABLE "Bolo" ALTER COLUMN "officerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Bolo" ADD CONSTRAINT "Bolo_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
