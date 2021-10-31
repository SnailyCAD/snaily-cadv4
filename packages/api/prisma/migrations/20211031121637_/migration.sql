-- CreateEnum
CREATE TYPE "DepartmentType" AS ENUM ('LEO', 'EMS_FD');

-- AlterTable
ALTER TABLE "DepartmentValue" ADD COLUMN     "type" "DepartmentType" NOT NULL DEFAULT E'LEO';
