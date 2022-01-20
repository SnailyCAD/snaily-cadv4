-- AlterTable
ALTER TABLE "BusinessPost" ADD COLUMN     "bodyData" JSONB,
ALTER COLUMN "body" DROP NOT NULL;
