-- AlterTable
ALTER TABLE "public"."models" ADD COLUMN     "data_source" TEXT,
ADD COLUMN     "last_verified" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "models_data_source_idx" ON "public"."models"("data_source");

-- CreateIndex
CREATE INDEX "models_last_verified_idx" ON "public"."models"("last_verified");
