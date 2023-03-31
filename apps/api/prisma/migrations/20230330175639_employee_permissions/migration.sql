-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "canManageEmployees" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManageVehicles" BOOLEAN NOT NULL DEFAULT false;
