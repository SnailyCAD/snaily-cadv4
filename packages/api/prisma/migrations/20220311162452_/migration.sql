-- AlterTable
ALTER TABLE "User" ADD COLUMN     "soundSettingsId" TEXT;

-- CreateTable
CREATE TABLE "UserSoundSettings" (
    "id" TEXT NOT NULL,
    "panicButton" BOOLEAN NOT NULL DEFAULT true,
    "signal100" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserSoundSettings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_soundSettingsId_fkey" FOREIGN KEY ("soundSettingsId") REFERENCES "UserSoundSettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
