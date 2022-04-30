-- CreateEnum
CREATE TYPE "DiscordWebhookType" AS ENUM ('CALL_911', 'PANIC_BUTTON', 'UNIT_STATUS', 'BOLO');

-- CreateTable
CREATE TABLE "DiscordWebhook" (
    "id" TEXT NOT NULL,
    "type" "DiscordWebhookType" NOT NULL,
    "webhookId" TEXT,
    "channelId" TEXT NOT NULL,
    "extraMessage" TEXT,
    "miscCadSettingsId" TEXT,

    CONSTRAINT "DiscordWebhook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiscordWebhook_type_key" ON "DiscordWebhook"("type");

-- AddForeignKey
ALTER TABLE "DiscordWebhook" ADD CONSTRAINT "DiscordWebhook_miscCadSettingsId_fkey" FOREIGN KEY ("miscCadSettingsId") REFERENCES "MiscCadSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
