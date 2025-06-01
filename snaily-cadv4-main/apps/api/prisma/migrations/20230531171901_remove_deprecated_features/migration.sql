-- DropForeignKey
ALTER TABLE "Officer" DROP CONSTRAINT "Officer_divisionId_fkey";

-- AlterTable
ALTER TABLE "MiscCadSettings" DROP COLUMN "boloWebhookId",
DROP COLUMN "call911WebhookId",
DROP COLUMN "panicButtonWebhookId",
DROP COLUMN "statusesWebhookId";

-- AlterTable
ALTER TABLE "Officer" DROP COLUMN "divisionId";
