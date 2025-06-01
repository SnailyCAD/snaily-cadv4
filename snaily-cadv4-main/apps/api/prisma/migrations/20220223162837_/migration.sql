-- CreateTable
CREATE TABLE "NameChangeRequest" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "userId" TEXT,
    "newName" TEXT NOT NULL,
    "newSurname" TEXT NOT NULL,
    "status" "WhitelistStatus" NOT NULL DEFAULT E'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NameChangeRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "NameChangeRequest" ADD CONSTRAINT "NameChangeRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NameChangeRequest" ADD CONSTRAINT "NameChangeRequest_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;
