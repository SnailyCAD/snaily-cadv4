-- CreateEnum
CREATE TYPE "Rank" AS ENUM ('OWNER', 'ADMIN', 'MODERATOR', 'USER');

-- CreateEnum
CREATE TYPE "WhitelistStatus" AS ENUM ('ACCEPTED', 'PENDING', 'DECLINED');

-- CreateEnum
CREATE TYPE "ValueType" AS ENUM ('LICENSE', 'GENDER', 'ETHNICITY', 'VEHICLE', 'WEAPON', 'BLOOD_GROUP');

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
    "userId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "surname" VARCHAR(255) NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" VARCHAR(255) NOT NULL,
    "ethnicity" VARCHAR(255) NOT NULL,
    "hairColor" VARCHAR(255) NOT NULL,
    "eyeColor" VARCHAR(255) NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "height" VARCHAR(255) NOT NULL,
    "weight" VARCHAR(255) NOT NULL,
    "driversLicense" VARCHAR(255),
    "weaponLicense" VARCHAR(255),
    "pilotLicense" VARCHAR(255),
    "ccw" VARCHAR(255),
    "imageId" TEXT,
    "note" TEXT,
    "dead" BOOLEAN DEFAULT false,
    "dateOfDead" TIMESTAMP(3),

    CONSTRAINT "Citizen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegisteredVehicle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "vinNumber" VARCHAR(255) NOT NULL,
    "plate" VARCHAR(255) NOT NULL,
    "model" TEXT NOT NULL,
    "color" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registrationStatus" VARCHAR(255) NOT NULL,
    "insuranceStatus" VARCHAR(255) NOT NULL,

    CONSTRAINT "RegisteredVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Weapon" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "serialNumber" VARCHAR(255) NOT NULL,
    "registrationStatus" VARCHAR(255) NOT NULL,
    "model" VARCHAR(255) NOT NULL,

    CONSTRAINT "Weapon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Value" (
    "id" TEXT NOT NULL,
    "type" "ValueType" NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    "isDefault" BOOLEAN NOT NULL,

    CONSTRAINT "Value_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "RegisteredVehicle_vinNumber_key" ON "RegisteredVehicle"("vinNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RegisteredVehicle_plate_key" ON "RegisteredVehicle"("plate");

-- CreateIndex
CREATE UNIQUE INDEX "Weapon_serialNumber_key" ON "Weapon"("serialNumber");

-- AddForeignKey
ALTER TABLE "cad" ADD CONSTRAINT "cad_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Citizen" ADD CONSTRAINT "Citizen_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegisteredVehicle" ADD CONSTRAINT "RegisteredVehicle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegisteredVehicle" ADD CONSTRAINT "RegisteredVehicle_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Weapon" ADD CONSTRAINT "Weapon_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Weapon" ADD CONSTRAINT "Weapon_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
