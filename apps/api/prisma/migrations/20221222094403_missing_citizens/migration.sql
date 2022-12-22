-- AlterTable
ALTER TABLE "Citizen" ADD COLUMN     "dateOfMissing" TIMESTAMP(3),
ADD COLUMN     "missing" BOOLEAN DEFAULT false;
