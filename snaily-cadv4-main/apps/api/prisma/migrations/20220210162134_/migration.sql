-- CreateTable
CREATE TABLE "SeizedItem" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "illegal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SeizedItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SeizedItem" ADD CONSTRAINT "SeizedItem_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "Record"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
