-- AlterTable
ALTER TABLE "PenalCode" ADD COLUMN     "position" INTEGER,
ADD COLUMN     "warningApplicableId" TEXT,
ADD COLUMN     "warningNotApplicableId" TEXT;

-- CreateTable
CREATE TABLE "WarningApplicable" (
    "id" TEXT NOT NULL,
    "fines" INTEGER[],

    CONSTRAINT "WarningApplicable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarningNotApplicable" (
    "id" TEXT NOT NULL,
    "fines" INTEGER[],
    "prisonTerm" INTEGER[],
    "bail" INTEGER[],

    CONSTRAINT "WarningNotApplicable_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PenalCode" ADD CONSTRAINT "PenalCode_warningApplicableId_fkey" FOREIGN KEY ("warningApplicableId") REFERENCES "WarningApplicable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PenalCode" ADD CONSTRAINT "PenalCode_warningNotApplicableId_fkey" FOREIGN KEY ("warningNotApplicableId") REFERENCES "WarningNotApplicable"("id") ON DELETE SET NULL ON UPDATE CASCADE;
