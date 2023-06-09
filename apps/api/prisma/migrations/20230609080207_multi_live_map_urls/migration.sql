-- CreateTable
CREATE TABLE "LiveMapURL" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "miscCadSettingsId" TEXT,

    CONSTRAINT "LiveMapURL_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LiveMapURL" ADD CONSTRAINT "LiveMapURL_miscCadSettingsId_fkey" FOREIGN KEY ("miscCadSettingsId") REFERENCES "MiscCadSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
