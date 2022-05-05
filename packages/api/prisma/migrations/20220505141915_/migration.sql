-- AlterTable
ALTER TABLE "CombinedLeoUnit" ADD COLUMN     "lastStatusChangeTimestamp" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "EmsFdDeputy" ADD COLUMN     "lastStatusChangeTimestamp" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Officer" ADD COLUMN     "lastStatusChangeTimestamp" TIMESTAMP(3);
