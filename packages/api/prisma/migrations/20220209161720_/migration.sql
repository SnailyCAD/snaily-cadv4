-- CreateTable
CREATE TABLE "SeizedItem" (
    "id" TEXT NOT NULL,
    "violationId" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "illegal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SeizedItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SeizedItem" ADD CONSTRAINT "SeizedItem_violationId_fkey" FOREIGN KEY ("violationId") REFERENCES "Violation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
