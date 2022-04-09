-- AlterTable
ALTER TABLE "UserSoundSettings" ADD COLUMN     "addedToCall" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stopRoleplay" BOOLEAN NOT NULL DEFAULT false;
