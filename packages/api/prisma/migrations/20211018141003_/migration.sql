-- CreateEnum
CREATE TYPE "WarrantStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "violations" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postal" VARCHAR(255) NOT NULL,
    "notes" TEXT NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArrestReport" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "charges" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postal" VARCHAR(255) NOT NULL,
    "notes" TEXT NOT NULL,

    CONSTRAINT "ArrestReport_pkey" PRIMARY KEY ("id")
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

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArrestReport" ADD CONSTRAINT "ArrestReport_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArrestReport" ADD CONSTRAINT "ArrestReport_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warrant" ADD CONSTRAINT "Warrant_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warrant" ADD CONSTRAINT "Warrant_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
