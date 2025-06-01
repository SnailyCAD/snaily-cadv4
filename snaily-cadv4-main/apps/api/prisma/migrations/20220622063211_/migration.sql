-- DropForeignKey
ALTER TABLE "ApiTokenLog" DROP CONSTRAINT "ApiTokenLog_apiTokenId_fkey";

-- AddForeignKey
ALTER TABLE "ApiTokenLog" ADD CONSTRAINT "ApiTokenLog_apiTokenId_fkey" FOREIGN KEY ("apiTokenId") REFERENCES "ApiToken"("id") ON DELETE CASCADE ON UPDATE CASCADE;
