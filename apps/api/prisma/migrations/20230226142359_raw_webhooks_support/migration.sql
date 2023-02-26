-- CreateTable
CREATE TABLE "RawWebhok" (
    "id" TEXT NOT NULL,
    "type" "DiscordWebhookType" NOT NULL,
    "url" TEXT NOT NULL,
    "miscCadSettingsId" TEXT,

    CONSTRAINT "RawWebhok_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RawWebhok_type_key" ON "RawWebhok"("type");

-- AddForeignKey
ALTER TABLE "RawWebhok" ADD CONSTRAINT "RawWebhok_miscCadSettingsId_fkey" FOREIGN KEY ("miscCadSettingsId") REFERENCES "MiscCadSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
