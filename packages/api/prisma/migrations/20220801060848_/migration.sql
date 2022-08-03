-- DropForeignKey
ALTER TABLE "ActiveDispatchers" DROP CONSTRAINT "ActiveDispatchers_userId_fkey";

-- AddForeignKey
ALTER TABLE "ActiveDispatchers" ADD CONSTRAINT "ActiveDispatchers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
