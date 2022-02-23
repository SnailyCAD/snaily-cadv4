-- AlterEnum
ALTER TYPE "Feature" ADD VALUE 'ALLOW_CITIZEN_NAME_CHANGES_VIA_COURT';

-- CreateTable
CREATE TABLE "NameChangeRequest" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "userId" TEXT,
    "newName" TEXT NOT NULL,
    "newSurame" TEXT NOT NULL,

    CONSTRAINT "NameChangeRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "NameChangeRequest" ADD CONSTRAINT "NameChangeRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NameChangeRequest" ADD CONSTRAINT "NameChangeRequest_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;
