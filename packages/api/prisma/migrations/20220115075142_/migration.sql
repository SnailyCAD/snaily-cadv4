-- AlterEnum
ALTER TYPE "Feature" ADD VALUE 'ACTIVE_DISPATCHERS';

-- CreateTable
CREATE TABLE "ActiveDispatchers" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ActiveDispatchers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ActiveDispatchers" ADD CONSTRAINT "ActiveDispatchers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
