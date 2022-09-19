-- CreateTable
CREATE TABLE "User2FA" (
    "id" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "User2FA_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "User2FA" ADD CONSTRAINT "User2FA_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
