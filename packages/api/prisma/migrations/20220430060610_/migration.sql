-- CreateTable
CREATE TABLE "ApiTokenLog" (
    "id" TEXT NOT NULL,
    "apiTokenId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statusCode" TEXT,
    "route" TEXT,
    "method" TEXT,

    CONSTRAINT "ApiTokenLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ApiTokenLog" ADD CONSTRAINT "ApiTokenLog_apiTokenId_fkey" FOREIGN KEY ("apiTokenId") REFERENCES "ApiToken"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
