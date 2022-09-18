-- CreateEnum
CREATE TYPE "Rank" AS ENUM ('OWNER', 'ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "WhitelistStatus" AS ENUM ('ACCEPTED', 'PENDING', 'DECLINED');

-- CreateEnum
CREATE TYPE "DepartmentType" AS ENUM ('LEO', 'EMS_FD');

-- CreateEnum
CREATE TYPE "ValueType" AS ENUM ('LICENSE', 'GENDER', 'ETHNICITY', 'VEHICLE', 'WEAPON', 'BLOOD_GROUP', 'BUSINESS_ROLE', 'CODES_10', 'PENAL_CODE', 'DEPARTMENT', 'OFFICER_RANK', 'DIVISION', 'DRIVERSLICENSE_CATEGORY', 'IMPOUND_LOT');

-- CreateEnum
CREATE TYPE "DriversLicenseCategoryType" AS ENUM ('AUTOMOTIVE', 'AVIATION', 'WATER');

-- CreateEnum
CREATE TYPE "EmployeeAsEnum" AS ENUM ('OWNER', 'MANAGER', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "StatusEnum" AS ENUM ('ON_DUTY', 'OFF_DUTY');

-- CreateEnum
CREATE TYPE "WhatPages" AS ENUM ('DISPATCH', 'EMS_FD', 'LEO');

-- CreateEnum
CREATE TYPE "ShouldDoType" AS ENUM ('SET_OFF_DUTY', 'SET_ON_DUTY', 'SET_ASSIGNED', 'SET_STATUS', 'PANIC_BUTTON');

-- CreateEnum
CREATE TYPE "BoloType" AS ENUM ('VEHICLE', 'PERSON', 'OTHER');

-- CreateEnum
CREATE TYPE "RecordType" AS ENUM ('ARREST_REPORT', 'TICKET', 'WRITTEN_WARNING');

-- CreateEnum
CREATE TYPE "WarrantStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "Feature" AS ENUM ('BLEETER', 'TOW', 'TAXI', 'COURTHOUSE', 'TRUCK_LOGS', 'AOP', 'BUSINESS');

-- CreateTable
CREATE TABLE "cad" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "ownerId" TEXT NOT NULL,
    "areaOfPlay" VARCHAR(255),
    "steamApiKey" VARCHAR(255),
    "discordWebhookURL" VARCHAR(255),
    "whitelisted" BOOLEAN NOT NULL DEFAULT false,
    "towWhitelisted" BOOLEAN NOT NULL DEFAULT false,
    "maxPlateLength" INTEGER NOT NULL DEFAULT 8,
    "liveMapSocketURl" VARCHAR(255),
    "logoId" TEXT,
    "registrationCode" TEXT,
    "disabledFeatures" "Feature"[],
    "miscCadSettingsId" TEXT,

    CONSTRAINT "cad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MiscCadSettings" (
    "id" TEXT NOT NULL,
    "heightPrefix" VARCHAR(255) NOT NULL DEFAULT E'cm',
    "weightPrefix" VARCHAR(255) NOT NULL DEFAULT E'kg',
    "maxCitizensPerUser" INTEGER,
    "maxPlateLength" INTEGER NOT NULL DEFAULT 8,
    "maxBusinessesPerCitizen" INTEGER,
    "callsignTemplate" TEXT NOT NULL DEFAULT E'{department}{callsign1} - {callsign2}{division}',
    "pairedUnitSymbol" VARCHAR(255) NOT NULL DEFAULT E'A',
    "signal100Enabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MiscCadSettings_pkey" PRIMARY KEY ("id")
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
    "banReason" TEXT,
    "avatarUrl" TEXT,
    "steamId" VARCHAR(255),
    "whitelistStatus" "WhitelistStatus" NOT NULL DEFAULT E'ACCEPTED',
    "isDarkTheme" BOOLEAN NOT NULL DEFAULT true,
    "tempPassword" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Citizen" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "surname" VARCHAR(255) NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "genderId" TEXT NOT NULL,
    "ethnicityId" TEXT NOT NULL,
    "hairColor" VARCHAR(255) NOT NULL,
    "eyeColor" VARCHAR(255) NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "height" VARCHAR(255) NOT NULL,
    "weight" VARCHAR(255) NOT NULL,
    "driversLicenseId" TEXT,
    "weaponLicenseId" TEXT,
    "pilotLicenseId" TEXT,
    "ccwId" TEXT,
    "imageId" TEXT,
    "note" TEXT,
    "dead" BOOLEAN DEFAULT false,
    "phoneNumber" TEXT,
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
    "modelId" TEXT NOT NULL,
    "color" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registrationStatusId" TEXT NOT NULL,
    "insuranceStatus" VARCHAR(255) NOT NULL,
    "reportedStolen" BOOLEAN NOT NULL DEFAULT false,
    "impounded" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RegisteredVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Weapon" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "serialNumber" VARCHAR(255) NOT NULL,
    "registrationStatusId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,

    CONSTRAINT "Weapon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "type" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "MedicalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Value" (
    "id" TEXT NOT NULL,
    "type" "ValueType" NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    "isDefault" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "position" INTEGER,

    CONSTRAINT "Value_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PenalCode" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "recordId" TEXT,

    CONSTRAINT "PenalCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DivisionValue" (
    "id" TEXT NOT NULL,
    "valueId" TEXT NOT NULL,
    "departmentId" TEXT,
    "callsign" TEXT,

    CONSTRAINT "DivisionValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepartmentValue" (
    "id" TEXT NOT NULL,
    "valueId" TEXT NOT NULL,
    "callsign" TEXT,
    "type" "DepartmentType" NOT NULL DEFAULT E'LEO',

    CONSTRAINT "DepartmentValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriversLicenseCategoryValue" (
    "id" TEXT NOT NULL,
    "valueId" TEXT NOT NULL,
    "type" "DriversLicenseCategoryType" NOT NULL,

    CONSTRAINT "DriversLicenseCategoryValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleValue" (
    "id" TEXT NOT NULL,
    "valueId" TEXT NOT NULL,
    "hash" TEXT,

    CONSTRAINT "VehicleValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeaponValue" (
    "id" TEXT NOT NULL,
    "valueId" TEXT NOT NULL,
    "hash" TEXT,

    CONSTRAINT "WeaponValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "executorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BleeterPost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "imageId" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BleeterPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TowCall" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "assignedUnitId" TEXT,
    "location" VARCHAR(255) NOT NULL,
    "deliveryAddressId" TEXT,
    "plate" VARCHAR(255),
    "model" VARCHAR(255),
    "description" TEXT NOT NULL,
    "creatorId" TEXT,
    "ended" BOOLEAN NOT NULL DEFAULT false,
    "callCountyService" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TowCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxiCall" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "assignedUnitId" TEXT,
    "location" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "creatorId" TEXT,

    CONSTRAINT "TaxiCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "whitelisted" BOOLEAN NOT NULL DEFAULT false,
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "roleId" TEXT,
    "employeeOfTheMonth" BOOLEAN NOT NULL DEFAULT false,
    "canCreatePosts" BOOLEAN NOT NULL DEFAULT true,
    "whitelistStatus" "WhitelistStatus" NOT NULL DEFAULT E'ACCEPTED',

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessPost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeValue" (
    "id" TEXT NOT NULL,
    "valueId" TEXT NOT NULL,
    "as" "EmployeeAsEnum" NOT NULL DEFAULT E'EMPLOYEE',

    CONSTRAINT "EmployeeValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Officer" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "callsign" VARCHAR(255) NOT NULL,
    "callsign2" VARCHAR(255) NOT NULL,
    "divisionId" TEXT NOT NULL,
    "rankId" TEXT,
    "statusId" TEXT,
    "suspended" BOOLEAN NOT NULL DEFAULT false,
    "badgeNumber" INTEGER,
    "imageId" VARCHAR(255),
    "citizenId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Officer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusValue" (
    "id" TEXT NOT NULL,
    "valueId" TEXT NOT NULL,
    "shouldDo" "ShouldDoType" NOT NULL DEFAULT E'SET_STATUS',
    "position" INTEGER,
    "whatPages" "WhatPages"[],
    "color" TEXT,

    CONSTRAINT "StatusValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficerLog" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,

    CONSTRAINT "OfficerLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImpoundedVehicle" (
    "id" TEXT NOT NULL,
    "registeredVehicleId" TEXT NOT NULL,
    "valueId" TEXT NOT NULL,

    CONSTRAINT "ImpoundedVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Call911" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "Call911_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignedUnit" (
    "id" TEXT NOT NULL,
    "officerId" TEXT,
    "emsFdDeputyId" TEXT,
    "call911Id" TEXT,

    CONSTRAINT "AssignedUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Call911Event" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "call911Id" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Call911Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bolo" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" "BoloType" NOT NULL,
    "description" TEXT NOT NULL,
    "plate" VARCHAR(255),
    "model" VARCHAR(255),
    "color" VARCHAR(255),
    "name" VARCHAR(255),
    "officerId" TEXT,

    CONSTRAINT "Bolo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Record" (
    "id" TEXT NOT NULL,
    "type" "RecordType" NOT NULL,
    "citizenId" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postal" VARCHAR(255) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "Record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warrant" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "WarrantStatus" NOT NULL DEFAULT E'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Warrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmsFdDeputy" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "callsign" VARCHAR(255) NOT NULL,
    "callsign2" VARCHAR(255) NOT NULL,
    "divisionId" TEXT NOT NULL,
    "rankId" TEXT,
    "statusId" TEXT,
    "suspended" BOOLEAN NOT NULL DEFAULT false,
    "badgeNumber" INTEGER,
    "imageId" VARCHAR(255),
    "citizenId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "EmsFdDeputy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TruckLog" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT,
    "userId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "startedAt" VARCHAR(255) NOT NULL,
    "endedAt" VARCHAR(255) NOT NULL,

    CONSTRAINT "TruckLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_dlCategoryToDLCategory" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_dlPilotCategoryToDLCategory" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_PenalCodeToRecord" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "RegisteredVehicle_vinNumber_key" ON "RegisteredVehicle"("vinNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RegisteredVehicle_plate_key" ON "RegisteredVehicle"("plate");

-- CreateIndex
CREATE UNIQUE INDEX "Weapon_serialNumber_key" ON "Weapon"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "_dlCategoryToDLCategory_AB_unique" ON "_dlCategoryToDLCategory"("A", "B");

-- CreateIndex
CREATE INDEX "_dlCategoryToDLCategory_B_index" ON "_dlCategoryToDLCategory"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_dlPilotCategoryToDLCategory_AB_unique" ON "_dlPilotCategoryToDLCategory"("A", "B");

-- CreateIndex
CREATE INDEX "_dlPilotCategoryToDLCategory_B_index" ON "_dlPilotCategoryToDLCategory"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PenalCodeToRecord_AB_unique" ON "_PenalCodeToRecord"("A", "B");

-- CreateIndex
CREATE INDEX "_PenalCodeToRecord_B_index" ON "_PenalCodeToRecord"("B");

-- AddForeignKey
ALTER TABLE "cad" ADD CONSTRAINT "cad_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cad" ADD CONSTRAINT "cad_miscCadSettingsId_fkey" FOREIGN KEY ("miscCadSettingsId") REFERENCES "MiscCadSettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Citizen" ADD CONSTRAINT "Citizen_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Citizen" ADD CONSTRAINT "Citizen_genderId_fkey" FOREIGN KEY ("genderId") REFERENCES "Value"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Citizen" ADD CONSTRAINT "Citizen_ethnicityId_fkey" FOREIGN KEY ("ethnicityId") REFERENCES "Value"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Citizen" ADD CONSTRAINT "Citizen_driversLicenseId_fkey" FOREIGN KEY ("driversLicenseId") REFERENCES "Value"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Citizen" ADD CONSTRAINT "Citizen_weaponLicenseId_fkey" FOREIGN KEY ("weaponLicenseId") REFERENCES "Value"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Citizen" ADD CONSTRAINT "Citizen_pilotLicenseId_fkey" FOREIGN KEY ("pilotLicenseId") REFERENCES "Value"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Citizen" ADD CONSTRAINT "Citizen_ccwId_fkey" FOREIGN KEY ("ccwId") REFERENCES "Value"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegisteredVehicle" ADD CONSTRAINT "RegisteredVehicle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegisteredVehicle" ADD CONSTRAINT "RegisteredVehicle_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegisteredVehicle" ADD CONSTRAINT "RegisteredVehicle_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "VehicleValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegisteredVehicle" ADD CONSTRAINT "RegisteredVehicle_registrationStatusId_fkey" FOREIGN KEY ("registrationStatusId") REFERENCES "Value"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Weapon" ADD CONSTRAINT "Weapon_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Weapon" ADD CONSTRAINT "Weapon_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Weapon" ADD CONSTRAINT "Weapon_registrationStatusId_fkey" FOREIGN KEY ("registrationStatusId") REFERENCES "Value"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Weapon" ADD CONSTRAINT "Weapon_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "WeaponValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DivisionValue" ADD CONSTRAINT "DivisionValue_valueId_fkey" FOREIGN KEY ("valueId") REFERENCES "Value"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DivisionValue" ADD CONSTRAINT "DivisionValue_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "DepartmentValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartmentValue" ADD CONSTRAINT "DepartmentValue_valueId_fkey" FOREIGN KEY ("valueId") REFERENCES "Value"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriversLicenseCategoryValue" ADD CONSTRAINT "DriversLicenseCategoryValue_valueId_fkey" FOREIGN KEY ("valueId") REFERENCES "Value"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleValue" ADD CONSTRAINT "VehicleValue_valueId_fkey" FOREIGN KEY ("valueId") REFERENCES "Value"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeaponValue" ADD CONSTRAINT "WeaponValue_valueId_fkey" FOREIGN KEY ("valueId") REFERENCES "Value"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_executorId_fkey" FOREIGN KEY ("executorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BleeterPost" ADD CONSTRAINT "BleeterPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TowCall" ADD CONSTRAINT "TowCall_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TowCall" ADD CONSTRAINT "TowCall_assignedUnitId_fkey" FOREIGN KEY ("assignedUnitId") REFERENCES "Citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TowCall" ADD CONSTRAINT "TowCall_deliveryAddressId_fkey" FOREIGN KEY ("deliveryAddressId") REFERENCES "Value"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TowCall" ADD CONSTRAINT "TowCall_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxiCall" ADD CONSTRAINT "TaxiCall_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxiCall" ADD CONSTRAINT "TaxiCall_assignedUnitId_fkey" FOREIGN KEY ("assignedUnitId") REFERENCES "Citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxiCall" ADD CONSTRAINT "TaxiCall_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "EmployeeValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessPost" ADD CONSTRAINT "BusinessPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessPost" ADD CONSTRAINT "BusinessPost_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessPost" ADD CONSTRAINT "BusinessPost_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeValue" ADD CONSTRAINT "EmployeeValue_valueId_fkey" FOREIGN KEY ("valueId") REFERENCES "Value"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Officer" ADD CONSTRAINT "Officer_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "DepartmentValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Officer" ADD CONSTRAINT "Officer_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "DivisionValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Officer" ADD CONSTRAINT "Officer_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "Value"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Officer" ADD CONSTRAINT "Officer_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "StatusValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Officer" ADD CONSTRAINT "Officer_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Officer" ADD CONSTRAINT "Officer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusValue" ADD CONSTRAINT "StatusValue_valueId_fkey" FOREIGN KEY ("valueId") REFERENCES "Value"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficerLog" ADD CONSTRAINT "OfficerLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficerLog" ADD CONSTRAINT "OfficerLog_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpoundedVehicle" ADD CONSTRAINT "ImpoundedVehicle_registeredVehicleId_fkey" FOREIGN KEY ("registeredVehicleId") REFERENCES "RegisteredVehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpoundedVehicle" ADD CONSTRAINT "ImpoundedVehicle_valueId_fkey" FOREIGN KEY ("valueId") REFERENCES "Value"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call911" ADD CONSTRAINT "Call911_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignedUnit" ADD CONSTRAINT "AssignedUnit_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignedUnit" ADD CONSTRAINT "AssignedUnit_emsFdDeputyId_fkey" FOREIGN KEY ("emsFdDeputyId") REFERENCES "EmsFdDeputy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignedUnit" ADD CONSTRAINT "AssignedUnit_call911Id_fkey" FOREIGN KEY ("call911Id") REFERENCES "Call911"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call911Event" ADD CONSTRAINT "Call911Event_call911Id_fkey" FOREIGN KEY ("call911Id") REFERENCES "Call911"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bolo" ADD CONSTRAINT "Bolo_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warrant" ADD CONSTRAINT "Warrant_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warrant" ADD CONSTRAINT "Warrant_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmsFdDeputy" ADD CONSTRAINT "EmsFdDeputy_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "DepartmentValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmsFdDeputy" ADD CONSTRAINT "EmsFdDeputy_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "DivisionValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmsFdDeputy" ADD CONSTRAINT "EmsFdDeputy_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "Value"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmsFdDeputy" ADD CONSTRAINT "EmsFdDeputy_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "StatusValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmsFdDeputy" ADD CONSTRAINT "EmsFdDeputy_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmsFdDeputy" ADD CONSTRAINT "EmsFdDeputy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TruckLog" ADD CONSTRAINT "TruckLog_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TruckLog" ADD CONSTRAINT "TruckLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TruckLog" ADD CONSTRAINT "TruckLog_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "RegisteredVehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_dlCategoryToDLCategory" ADD FOREIGN KEY ("A") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_dlCategoryToDLCategory" ADD FOREIGN KEY ("B") REFERENCES "DriversLicenseCategoryValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_dlPilotCategoryToDLCategory" ADD FOREIGN KEY ("A") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_dlPilotCategoryToDLCategory" ADD FOREIGN KEY ("B") REFERENCES "DriversLicenseCategoryValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PenalCodeToRecord" ADD FOREIGN KEY ("A") REFERENCES "PenalCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PenalCodeToRecord" ADD FOREIGN KEY ("B") REFERENCES "Record"("id") ON DELETE CASCADE ON UPDATE CASCADE;
