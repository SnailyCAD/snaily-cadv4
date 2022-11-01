-- DropForeignKey
ALTER TABLE "AddressValue" DROP CONSTRAINT "AddressValue_valueId_fkey";

-- AddForeignKey
ALTER TABLE "AddressValue" ADD CONSTRAINT "AddressValue_valueId_fkey" FOREIGN KEY ("valueId") REFERENCES "Value"("id") ON DELETE CASCADE ON UPDATE CASCADE;
