-- CreateTable
CREATE TABLE "providers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo_url" TEXT,
    "website_url" TEXT,
    "status_page_url" TEXT,
    "documentation_url" TEXT,
    "regions" TEXT NOT NULL DEFAULT '[]',
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "models" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "foundation_model" TEXT,
    "released_at" DATETIME,
    "deprecated_at" DATETIME,
    "sunset_at" DATETIME,
    "modalities" TEXT NOT NULL DEFAULT '[]',
    "capabilities" TEXT NOT NULL DEFAULT '[]',
    "context_window" INTEGER,
    "max_output_tokens" INTEGER,
    "training_cutoff" DATETIME,
    "api_version" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "models_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "model_endpoints" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "model_id" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "endpoint_url" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "model_endpoints_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "models" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pricing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "model_id" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "region" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "input_per_million" REAL,
    "output_per_million" REAL,
    "image_per_unit" REAL,
    "audio_per_minute" REAL,
    "video_per_minute" REAL,
    "fine_tuning_per_million" REAL,
    "volume_discounts" TEXT NOT NULL DEFAULT '[]',
    "effective_from" DATETIME NOT NULL,
    "effective_to" DATETIME,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pricing_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "models" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "benchmark_suites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "version" TEXT,
    "evaluation_type" TEXT,
    "max_score" REAL,
    "scoring_method" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "benchmark_scores" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "model_id" TEXT NOT NULL,
    "suite_id" TEXT NOT NULL,
    "score_raw" REAL NOT NULL,
    "score_normalized" REAL,
    "percentile" INTEGER,
    "evaluation_date" DATETIME NOT NULL,
    "evaluation_commit" TEXT,
    "configuration" TEXT NOT NULL DEFAULT '{}',
    "notes" TEXT,
    "is_official" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "benchmark_scores_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "models" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "benchmark_scores_suite_id_fkey" FOREIGN KEY ("suite_id") REFERENCES "benchmark_suites" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "model_id" TEXT,
    "provider_id" TEXT,
    "regions" TEXT NOT NULL DEFAULT '[]',
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "impact_description" TEXT,
    "started_at" DATETIME NOT NULL,
    "identified_at" DATETIME,
    "resolved_at" DATETIME,
    "postmortem_url" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "incidents_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "models" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "incidents_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "model_status" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "model_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'operational',
    "availability" REAL NOT NULL DEFAULT 99.9,
    "latency_p50" INTEGER NOT NULL DEFAULT 100,
    "latency_p95" INTEGER NOT NULL DEFAULT 200,
    "latency_p99" INTEGER NOT NULL DEFAULT 500,
    "error_rate" REAL NOT NULL DEFAULT 0.1,
    "requests_per_min" INTEGER NOT NULL DEFAULT 0,
    "tokens_per_min" INTEGER NOT NULL DEFAULT 0,
    "usage" REAL NOT NULL DEFAULT 0,
    "region" TEXT,
    "checked_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "model_status_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "models" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "providers_slug_key" ON "providers"("slug");

-- CreateIndex
CREATE INDEX "providers_slug_idx" ON "providers"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "models_slug_key" ON "models"("slug");

-- CreateIndex
CREATE INDEX "models_provider_id_idx" ON "models"("provider_id");

-- CreateIndex
CREATE INDEX "models_slug_idx" ON "models"("slug");

-- CreateIndex
CREATE INDEX "models_foundation_model_idx" ON "models"("foundation_model");

-- CreateIndex
CREATE INDEX "models_is_active_idx" ON "models"("is_active");

-- CreateIndex
CREATE INDEX "model_endpoints_model_id_region_idx" ON "model_endpoints"("model_id", "region");

-- CreateIndex
CREATE UNIQUE INDEX "model_endpoints_model_id_region_key" ON "model_endpoints"("model_id", "region");

-- CreateIndex
CREATE INDEX "pricing_model_id_idx" ON "pricing"("model_id");

-- CreateIndex
CREATE INDEX "pricing_region_idx" ON "pricing"("region");

-- CreateIndex
CREATE INDEX "pricing_effective_from_effective_to_idx" ON "pricing"("effective_from", "effective_to");

-- CreateIndex
CREATE UNIQUE INDEX "benchmark_suites_slug_key" ON "benchmark_suites"("slug");

-- CreateIndex
CREATE INDEX "benchmark_suites_slug_idx" ON "benchmark_suites"("slug");

-- CreateIndex
CREATE INDEX "benchmark_suites_category_idx" ON "benchmark_suites"("category");

-- CreateIndex
CREATE INDEX "benchmark_scores_model_id_idx" ON "benchmark_scores"("model_id");

-- CreateIndex
CREATE INDEX "benchmark_scores_suite_id_idx" ON "benchmark_scores"("suite_id");

-- CreateIndex
CREATE INDEX "benchmark_scores_evaluation_date_idx" ON "benchmark_scores"("evaluation_date");

-- CreateIndex
CREATE UNIQUE INDEX "benchmark_scores_model_id_suite_id_evaluation_date_key" ON "benchmark_scores"("model_id", "suite_id", "evaluation_date");

-- CreateIndex
CREATE INDEX "incidents_model_id_idx" ON "incidents"("model_id");

-- CreateIndex
CREATE INDEX "incidents_provider_id_idx" ON "incidents"("provider_id");

-- CreateIndex
CREATE INDEX "incidents_started_at_idx" ON "incidents"("started_at");

-- CreateIndex
CREATE INDEX "incidents_status_idx" ON "incidents"("status");

-- CreateIndex
CREATE INDEX "model_status_model_id_idx" ON "model_status"("model_id");

-- CreateIndex
CREATE INDEX "model_status_status_idx" ON "model_status"("status");

-- CreateIndex
CREATE INDEX "model_status_checked_at_idx" ON "model_status"("checked_at");

-- CreateIndex
CREATE UNIQUE INDEX "model_status_model_id_region_key" ON "model_status"("model_id", "region");
