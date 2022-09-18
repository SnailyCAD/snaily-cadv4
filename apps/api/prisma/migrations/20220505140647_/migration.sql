-- DropForeignKey
ALTER TABLE "EmsFdDeputy" DROP CONSTRAINT "EmsFdDeputy_departmentId_fkey";

-- AlterTable
ALTER TABLE "EmsFdDeputy" ADD COLUMN     "whitelistStatusId" TEXT,
ALTER COLUMN "departmentId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "EmsFdDeputy" ADD CONSTRAINT "EmsFdDeputy_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "DepartmentValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmsFdDeputy" ADD CONSTRAINT "EmsFdDeputy_whitelistStatusId_fkey" FOREIGN KEY ("whitelistStatusId") REFERENCES "LeoWhitelistStatus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
