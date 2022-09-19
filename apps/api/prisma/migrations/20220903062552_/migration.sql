-- CreateEnum
CREATE TYPE "ToAddDefaultPermissionsKey" AS ENUM ('MANAGE_WARRANTS_PERMISSIONS');

-- CreateTable
CREATE TABLE "ToAddDefaultPermissions" (
    "id" TEXT NOT NULL,
    "key" "ToAddDefaultPermissionsKey" NOT NULL,
    "userId" TEXT NOT NULL,
    "permissions" TEXT[],
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ToAddDefaultPermissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ToAddDefaultPermissions_key_userId_key" ON "ToAddDefaultPermissions"("key", "userId");

-- AddForeignKey
ALTER TABLE "ToAddDefaultPermissions" ADD CONSTRAINT "ToAddDefaultPermissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
