-- DropForeignKey
ALTER TABLE "CustomFieldValue" DROP CONSTRAINT "CustomFieldValue_fieldId_fkey";

-- AddForeignKey
ALTER TABLE "CustomFieldValue" ADD CONSTRAINT "CustomFieldValue_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "CustomField"("id") ON DELETE CASCADE ON UPDATE CASCADE;
