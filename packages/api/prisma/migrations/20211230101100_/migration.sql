-- AlterEnum
ALTER TYPE "Feature" ADD VALUE 'SOCIAL_SECURITY_NUMBERS';

-- AlterTable
ALTER TABLE "Citizen" ADD COLUMN     "socialSecurityNumber" TEXT;
