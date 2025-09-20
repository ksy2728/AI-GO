-- CreateTable
CREATE TABLE "change_logs" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "provider_id" TEXT NOT NULL,
    "model_id" TEXT NOT NULL,
    "change_type" TEXT NOT NULL,
    "change_data" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "change_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "change_logs_provider_id_idx" ON "change_logs"("provider_id");
CREATE INDEX "change_logs_model_id_idx" ON "change_logs"("model_id");
CREATE INDEX "change_logs_created_at_idx" ON "change_logs"("created_at");
CREATE INDEX "change_logs_change_type_idx" ON "change_logs"("change_type");

-- AddForeignKey
ALTER TABLE "change_logs" ADD CONSTRAINT "change_logs_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;