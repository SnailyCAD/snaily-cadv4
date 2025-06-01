-- CreateTable
CREATE TABLE "_businessValueBusinessRoles" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_businessValueBusinessRoles_AB_unique" ON "_businessValueBusinessRoles"("A", "B");

-- CreateIndex
CREATE INDEX "_businessValueBusinessRoles_B_index" ON "_businessValueBusinessRoles"("B");

-- AddForeignKey
ALTER TABLE "_businessValueBusinessRoles" ADD CONSTRAINT "_businessValueBusinessRoles_A_fkey" FOREIGN KEY ("A") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_businessValueBusinessRoles" ADD CONSTRAINT "_businessValueBusinessRoles_B_fkey" FOREIGN KEY ("B") REFERENCES "EmployeeValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
