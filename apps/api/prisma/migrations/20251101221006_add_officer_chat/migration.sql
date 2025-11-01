-- CreateTable
CREATE TABLE "OfficerChat" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,

    CONSTRAINT "OfficerChat_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OfficerChat" ADD CONSTRAINT "OfficerChat_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "ChatCreator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
