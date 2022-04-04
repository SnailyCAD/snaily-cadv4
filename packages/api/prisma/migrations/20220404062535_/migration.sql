-- CreateTable
CREATE TABLE "_CitizenToCustomFieldValue" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CitizenToCustomFieldValue_AB_unique" ON "_CitizenToCustomFieldValue"("A", "B");

-- CreateIndex
CREATE INDEX "_CitizenToCustomFieldValue_B_index" ON "_CitizenToCustomFieldValue"("B");

-- AddForeignKey
ALTER TABLE "_CitizenToCustomFieldValue" ADD FOREIGN KEY ("A") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CitizenToCustomFieldValue" ADD FOREIGN KEY ("B") REFERENCES "CustomFieldValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
