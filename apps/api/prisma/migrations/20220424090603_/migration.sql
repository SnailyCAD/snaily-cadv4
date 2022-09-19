-- AlterEnum
ALTER TYPE "Feature" ADD VALUE 'USER_API_TOKENS';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "apiTokenId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_apiTokenId_fkey" FOREIGN KEY ("apiTokenId") REFERENCES "ApiToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;
