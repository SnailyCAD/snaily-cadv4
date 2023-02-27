-- CreateTable
CREATE TABLE "RawWebhook" (
    "id" TEXT NOT NULL,
    "type" "DiscordWebhookType" NOT NULL,
    "url" TEXT NOT NULL,
    "miscCadSettingsId" TEXT,

    CONSTRAINT "RawWebhook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RawWebhook_type_key" ON "RawWebhook"("type");

-- AddForeignKey
ALTER TABLE "RawWebhook" ADD CONSTRAINT "RawWebhook_miscCadSettingsId_fkey" FOREIGN KEY ("miscCadSettingsId") REFERENCES "MiscCadSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
