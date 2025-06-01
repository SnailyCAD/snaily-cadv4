-- AlterTable
ALTER TABLE "Call911" ADD COLUMN     "dispositionCodeId" TEXT;

-- AlterTable
ALTER TABLE "CallTypeValue" ADD COLUMN     "isDisposition" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "Call911" ADD CONSTRAINT "Call911_dispositionCodeId_fkey" FOREIGN KEY ("dispositionCodeId") REFERENCES "CallTypeValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
