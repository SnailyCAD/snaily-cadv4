-- AlterTable
ALTER TABLE "DiscordRoles" ADD COLUMN     "adminRolePermissions" TEXT[],
ADD COLUMN     "dispatchRolePermissions" TEXT[],
ADD COLUMN     "emsFdRolePermissions" TEXT[],
ADD COLUMN     "leoRolePermissions" TEXT[],
ADD COLUMN     "leoSupervisorRolePermissions" TEXT[],
ADD COLUMN     "taxiRolePermissions" TEXT[],
ADD COLUMN     "towRolePermissions" TEXT[];
