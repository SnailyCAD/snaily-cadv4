-- AlterEnum
ALTER TYPE "Feature" ADD VALUE 'COURTHOUSE_POSTS';

-- CreateTable
CREATE TABLE "CourthousePost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "descriptionData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourthousePost_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CourthousePost" ADD CONSTRAINT "CourthousePost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
