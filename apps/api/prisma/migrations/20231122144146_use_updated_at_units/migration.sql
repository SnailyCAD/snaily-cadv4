-- AlterTable
ALTER TABLE "CombinedEmsFdUnit" DROP COLUMN "lastStatusChangeTimestamp",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "CombinedLeoUnit" DROP COLUMN "lastStatusChangeTimestamp",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "EmsFdDeputy" DROP COLUMN "lastStatusChangeTimestamp";

-- AlterTable
ALTER TABLE "MiscCadSettings" DROP COLUMN "inactivityTimeout";

-- AlterTable
ALTER TABLE "Officer" DROP COLUMN "lastStatusChangeTimestamp";
