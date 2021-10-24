-- CreateTable
CREATE TABLE "TruckLog" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT,
    "userId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TruckLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TruckLog" ADD CONSTRAINT "TruckLog_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TruckLog" ADD CONSTRAINT "TruckLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TruckLog" ADD CONSTRAINT "TruckLog_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "RegisteredVehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
