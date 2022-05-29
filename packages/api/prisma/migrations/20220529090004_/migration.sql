-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_executorId_fkey";

-- DropForeignKey
ALTER TABLE "User2FA" DROP CONSTRAINT "User2FA_userId_fkey";

-- AddForeignKey
ALTER TABLE "User2FA" ADD CONSTRAINT "User2FA_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_executorId_fkey" FOREIGN KEY ("executorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
