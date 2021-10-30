-- CreateTable
CREATE TABLE "VehicleValue" (
    "id" TEXT NOT NULL,
    "valueId" TEXT NOT NULL,
    "hash" TEXT,

    CONSTRAINT "VehicleValue_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VehicleValue" ADD CONSTRAINT "VehicleValue_valueId_fkey" FOREIGN KEY ("valueId") REFERENCES "Value"("id") ON DELETE CASCADE ON UPDATE CASCADE;
