-- AlterEnum
ALTER TYPE "Feature" ADD VALUE 'CUSTOM_TEXTFIELD_VALUES';

-- CreateTable
CREATE TABLE "CadFeature" (
    "id" TEXT NOT NULL,
    "feature" "Feature" NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "cadId" TEXT,

    CONSTRAINT "CadFeature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CadFeature_feature_key" ON "CadFeature"("feature");

-- AddForeignKey
ALTER TABLE "CadFeature" ADD CONSTRAINT "CadFeature_cadId_fkey" FOREIGN KEY ("cadId") REFERENCES "cad"("id") ON DELETE SET NULL ON UPDATE CASCADE;
