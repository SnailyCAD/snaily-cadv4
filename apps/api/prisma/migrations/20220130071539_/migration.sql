-- CreateTable
CREATE TABLE "_Call911ToDivisionValue" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_Call911ToDepartmentValue" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_Call911ToDivisionValue_AB_unique" ON "_Call911ToDivisionValue"("A", "B");

-- CreateIndex
CREATE INDEX "_Call911ToDivisionValue_B_index" ON "_Call911ToDivisionValue"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_Call911ToDepartmentValue_AB_unique" ON "_Call911ToDepartmentValue"("A", "B");

-- CreateIndex
CREATE INDEX "_Call911ToDepartmentValue_B_index" ON "_Call911ToDepartmentValue"("B");

-- AddForeignKey
ALTER TABLE "_Call911ToDivisionValue" ADD FOREIGN KEY ("A") REFERENCES "Call911"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Call911ToDivisionValue" ADD FOREIGN KEY ("B") REFERENCES "DivisionValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Call911ToDepartmentValue" ADD FOREIGN KEY ("A") REFERENCES "Call911"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Call911ToDepartmentValue" ADD FOREIGN KEY ("B") REFERENCES "DepartmentValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
