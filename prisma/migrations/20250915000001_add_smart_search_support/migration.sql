-- Add search optimization fields to models table
ALTER TABLE "models"
ADD COLUMN IF NOT EXISTS "search_vector" tsvector,
ADD COLUMN IF NOT EXISTS "tags" text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "intelligence_score" integer,
ADD COLUMN IF NOT EXISTS "output_speed" integer,
ADD COLUMN IF NOT EXISTS "input_price" decimal(10,4),
ADD COLUMN IF NOT EXISTS "output_price" decimal(10,4);

-- Create SavedFilter table for search presets
CREATE TABLE IF NOT EXISTS "saved_filters" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "description" text,
  "filters" jsonb NOT NULL DEFAULT '{}',
  "user_id" text,
  "is_public" boolean DEFAULT false,
  "usage_count" integer DEFAULT 0,
  "created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP
);

-- Create search optimization indexes
CREATE INDEX IF NOT EXISTS "idx_models_search_vector"
ON "models" USING gin("search_vector");

CREATE INDEX IF NOT EXISTS "idx_models_performance"
ON "models" ("intelligence_score" DESC, "output_speed" DESC, "input_price" ASC)
WHERE "is_active" = true;

CREATE INDEX IF NOT EXISTS "idx_models_tags"
ON "models" USING gin("tags");

CREATE INDEX IF NOT EXISTS "idx_models_capabilities_gin"
ON "models" USING gin(("capabilities"::jsonb));

-- Create indexes for SavedFilter table
CREATE INDEX IF NOT EXISTS "idx_saved_filters_user_public"
ON "saved_filters" ("user_id", "is_public");

CREATE INDEX IF NOT EXISTS "idx_saved_filters_usage"
ON "saved_filters" ("usage_count" DESC);

-- Function to update search vector automatically
CREATE OR REPLACE FUNCTION update_model_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description,'')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.foundation_model,'')), 'C') ||
    setweight(to_tsvector('english',
      array_to_string(
        ARRAY(SELECT jsonb_array_elements_text(NEW.capabilities::jsonb)),
        ' '
      )
    ), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic search vector updates
DROP TRIGGER IF EXISTS "trigger_update_model_search_vector" ON "models";
CREATE TRIGGER "trigger_update_model_search_vector"
  BEFORE INSERT OR UPDATE OF "name", "description", "foundation_model", "capabilities"
  ON "models"
  FOR EACH ROW
  EXECUTE FUNCTION update_model_search_vector();

-- Update existing records to populate search vectors
UPDATE "models"
SET "search_vector" =
  setweight(to_tsvector('english', coalesce("name",'')), 'A') ||
  setweight(to_tsvector('english', coalesce("description",'')), 'B') ||
  setweight(to_tsvector('english', coalesce("foundation_model",'')), 'C') ||
  setweight(to_tsvector('english',
    array_to_string(
      ARRAY(SELECT jsonb_array_elements_text("capabilities"::jsonb)),
      ' '
    )
  ), 'D')
WHERE "search_vector" IS NULL;