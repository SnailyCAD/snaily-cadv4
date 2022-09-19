-- CreateTable
CREATE TABLE "CustomRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iconId" TEXT,
    "permissions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CustomRoleToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomRole_name_key" ON "CustomRole"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_CustomRoleToUser_AB_unique" ON "_CustomRoleToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_CustomRoleToUser_B_index" ON "_CustomRoleToUser"("B");

-- AddForeignKey
ALTER TABLE "_CustomRoleToUser" ADD CONSTRAINT "_CustomRoleToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "CustomRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CustomRoleToUser" ADD CONSTRAINT "_CustomRoleToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
