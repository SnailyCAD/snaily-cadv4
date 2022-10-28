-- AlterTable
ALTER TABLE "ImpoundedVehicle" ADD COLUMN     "officerId" TEXT;

-- AddForeignKey
ALTER TABLE "ImpoundedVehicle" ADD CONSTRAINT "ImpoundedVehicle_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
