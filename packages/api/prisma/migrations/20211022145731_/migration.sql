-- CreateTable
CREATE TABLE "EmsFdDeputy" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "departmentId" TEXT NOT NULL,
    "callsign" VARCHAR(255) NOT NULL,
    "divisionId" TEXT NOT NULL,
    "rankId" TEXT,
    "status" "StatusEnum" NOT NULL DEFAULT E'OFF_DUTY',
    "status2Id" TEXT,
    "suspended" BOOLEAN NOT NULL DEFAULT false,
    "badgeNumber" INTEGER,
    "citizenId" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "EmsFdDeputy_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EmsFdDeputy" ADD CONSTRAINT "EmsFdDeputy_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Value"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmsFdDeputy" ADD CONSTRAINT "EmsFdDeputy_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "DivisionValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmsFdDeputy" ADD CONSTRAINT "EmsFdDeputy_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "Value"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmsFdDeputy" ADD CONSTRAINT "EmsFdDeputy_status2Id_fkey" FOREIGN KEY ("status2Id") REFERENCES "StatusValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmsFdDeputy" ADD CONSTRAINT "EmsFdDeputy_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmsFdDeputy" ADD CONSTRAINT "EmsFdDeputy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
