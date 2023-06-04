-- AlterTable
ALTER TABLE "BleeterPost" ADD COLUMN     "creatorId" TEXT;

-- CreateTable
CREATE TABLE "BleeterProfile" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "handle" VARCHAR(255) NOT NULL,
    "isVerified" BOOLEAN DEFAULT false,
    "bio" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BleeterProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BleeterProfileFollow" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "followerProfileId" TEXT,
    "followingProfileId" TEXT,

    CONSTRAINT "BleeterProfileFollow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BleeterProfile_handle_key" ON "BleeterProfile"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "BleeterProfile_userId_key" ON "BleeterProfile"("userId");

-- AddForeignKey
ALTER TABLE "BleeterProfile" ADD CONSTRAINT "BleeterProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BleeterProfileFollow" ADD CONSTRAINT "BleeterProfileFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BleeterProfileFollow" ADD CONSTRAINT "BleeterProfileFollow_followerProfileId_fkey" FOREIGN KEY ("followerProfileId") REFERENCES "BleeterProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BleeterProfileFollow" ADD CONSTRAINT "BleeterProfileFollow_followingProfileId_fkey" FOREIGN KEY ("followingProfileId") REFERENCES "BleeterProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BleeterPost" ADD CONSTRAINT "BleeterPost_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "BleeterProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
