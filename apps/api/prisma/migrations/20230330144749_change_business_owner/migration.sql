
-- DropForeignKey
ALTER TABLE "Business" DROP CONSTRAINT "Business_citizenId_fkey";

-- AlterTable
ALTER TABLE "Business" DROP COLUMN "citizenId";
