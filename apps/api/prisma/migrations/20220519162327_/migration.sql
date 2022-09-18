-- CreateTable
CREATE TABLE "_officerRankDepartments" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_officerRankDepartments_AB_unique" ON "_officerRankDepartments"("A", "B");

-- CreateIndex
CREATE INDEX "_officerRankDepartments_B_index" ON "_officerRankDepartments"("B");

-- AddForeignKey
ALTER TABLE "_officerRankDepartments" ADD CONSTRAINT "_officerRankDepartments_A_fkey" FOREIGN KEY ("A") REFERENCES "DepartmentValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_officerRankDepartments" ADD CONSTRAINT "_officerRankDepartments_B_fkey" FOREIGN KEY ("B") REFERENCES "Value"("id") ON DELETE CASCADE ON UPDATE CASCADE;
