-- AlterTable
ALTER TABLE "cad" ADD COLUMN     "autoSetUserPropertiesId" TEXT;

-- CreateTable
CREATE TABLE "AutoSetPropertiesUser" (
    "id" TEXT NOT NULL,
    "leo" BOOLEAN DEFAULT false,
    "dispatch" BOOLEAN DEFAULT false,
    "emsFd" BOOLEAN DEFAULT false,

    CONSTRAINT "AutoSetPropertiesUser_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "cad" ADD CONSTRAINT "cad_autoSetUserPropertiesId_fkey" FOREIGN KEY ("autoSetUserPropertiesId") REFERENCES "AutoSetPropertiesUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
