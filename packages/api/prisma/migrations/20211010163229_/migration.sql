-- CreateTable
CREATE TABLE "BleeterPost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "imageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BleeterPost_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BleeterPost" ADD CONSTRAINT "BleeterPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
