-- AlterTable
ALTER TABLE "DepartmentValue" ADD COLUMN     "isDefaultDepartment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "whitelisted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Officer" ADD COLUMN     "whitelistStatusId" TEXT;

-- CreateTable
CREATE TABLE "LeoWhitelistStatus" (
    "id" TEXT NOT NULL,
    "status" "WhitelistStatus" NOT NULL,
    "defaultDepartmentId" TEXT,

    CONSTRAINT "LeoWhitelistStatus_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Officer" ADD CONSTRAINT "Officer_whitelistStatusId_fkey" FOREIGN KEY ("whitelistStatusId") REFERENCES "LeoWhitelistStatus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeoWhitelistStatus" ADD CONSTRAINT "LeoWhitelistStatus_defaultDepartmentId_fkey" FOREIGN KEY ("defaultDepartmentId") REFERENCES "DepartmentValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
