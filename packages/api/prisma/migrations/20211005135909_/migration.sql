-- CreateEnum
CREATE TYPE "Rank" AS ENUM ('OWNER', 'ADMIN', 'MODERATOR', 'USER');

-- CreateEnum
CREATE TYPE "WhitelistStatus" AS ENUM ('ACCEPTED', 'PENDING', 'DECLINED');

-- CreateTable
CREATE TABLE "cad" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "ownerId" TEXT NOT NULL,
    "areaOfPlay" VARCHAR(255),
    "steamApiKey" VARCHAR(255),
    "whitelisted" BOOLEAN NOT NULL DEFAULT false,
    "towWhitelisted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "cad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "password" TEXT NOT NULL,
    "rank" "Rank" NOT NULL DEFAULT E'USER',
    "isLeo" BOOLEAN NOT NULL DEFAULT false,
    "isSupervisor" BOOLEAN NOT NULL DEFAULT false,
    "isEmsFd" BOOLEAN NOT NULL DEFAULT false,
    "isDispatch" BOOLEAN NOT NULL DEFAULT false,
    "isTow" BOOLEAN NOT NULL DEFAULT false,
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "banReason" BOOLEAN,
    "avatarUrl" TEXT,
    "steamId" VARCHAR(255),
    "whitelistStatus" "WhitelistStatus" NOT NULL DEFAULT E'ACCEPTED',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Citizen" (
    "id" TEXT NOT NULL,
    "cadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" VARCHAR(255) NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" VARCHAR(255) NOT NULL,
    "ethnicity" VARCHAR(255) NOT NULL,
    "hairColor" VARCHAR(255) NOT NULL,
    "eyeColor" VARCHAR(255) NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "height" VARCHAR(255) NOT NULL,
    "weight" VARCHAR(255) NOT NULL,
    "driversLicense" VARCHAR(255) NOT NULL,
    "weaponLicense" VARCHAR(255) NOT NULL,
    "pilotLicense" VARCHAR(255) NOT NULL,
    "ccw" VARCHAR(255) NOT NULL,
    "imageId" TEXT,
    "note" TEXT,
    "dead" BOOLEAN NOT NULL DEFAULT false,
    "dateOfDead" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Citizen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_UsersToCad" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "_UsersToCad_AB_unique" ON "_UsersToCad"("A", "B");

-- CreateIndex
CREATE INDEX "_UsersToCad_B_index" ON "_UsersToCad"("B");

-- AddForeignKey
ALTER TABLE "cad" ADD CONSTRAINT "cad_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Citizen" ADD CONSTRAINT "Citizen_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Citizen" ADD CONSTRAINT "Citizen_cadId_fkey" FOREIGN KEY ("cadId") REFERENCES "cad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UsersToCad" ADD FOREIGN KEY ("A") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UsersToCad" ADD FOREIGN KEY ("B") REFERENCES "cad"("id") ON DELETE CASCADE ON UPDATE CASCADE;
