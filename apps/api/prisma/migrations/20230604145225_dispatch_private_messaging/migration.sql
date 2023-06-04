-- CreateTable
CREATE TABLE "DispatchChat" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT NOT NULL,
    "creatorId" TEXT,

    CONSTRAINT "DispatchChat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatCreator" (
    "id" TEXT NOT NULL,
    "officerId" TEXT,
    "emsFdDeputyId" TEXT,
    "combinedLeoId" TEXT,
    "combinedEmsFdId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatCreator_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DispatchChat" ADD CONSTRAINT "DispatchChat_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "ChatCreator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatCreator" ADD CONSTRAINT "ChatCreator_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatCreator" ADD CONSTRAINT "ChatCreator_emsFdDeputyId_fkey" FOREIGN KEY ("emsFdDeputyId") REFERENCES "EmsFdDeputy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatCreator" ADD CONSTRAINT "ChatCreator_combinedLeoId_fkey" FOREIGN KEY ("combinedLeoId") REFERENCES "CombinedLeoUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatCreator" ADD CONSTRAINT "ChatCreator_combinedEmsFdId_fkey" FOREIGN KEY ("combinedEmsFdId") REFERENCES "CombinedEmsFdUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
