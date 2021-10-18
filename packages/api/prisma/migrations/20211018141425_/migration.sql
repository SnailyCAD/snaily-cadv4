-- CreateTable
CREATE TABLE "OfficerLog" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,

    CONSTRAINT "OfficerLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OfficerLog" ADD CONSTRAINT "OfficerLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficerLog" ADD CONSTRAINT "OfficerLog_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
