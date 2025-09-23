-- Production Database Cleanup Script
-- Generated: 2025-09-23 10:11:10

-- Step 1: Show test data that will be deleted
SELECT 'Models to delete:' as info;
SELECT id, name, slug FROM "Model"
WHERE name LIKE '%GPT-5%'
   OR name LIKE '%gpt-oss%'
   OR name LIKE '%Grok 3 mini%'
   OR name LIKE '%test%'
   OR name LIKE '%demo%'
   OR name LIKE '%example%'
LIMIT 20;

-- Step 2: Delete related ModelStatus records
DELETE FROM "ModelStatus"
WHERE "model_id" IN (
  SELECT id FROM "Model"
  WHERE name LIKE '%GPT-5%'
     OR name LIKE '%gpt-oss%'
     OR name LIKE '%Grok 3 mini%'
     OR name LIKE '%test%'
     OR name LIKE '%demo%'
);

-- Step 3: Delete related BenchmarkScore records
DELETE FROM "BenchmarkScore"
WHERE "model_id" IN (
  SELECT id FROM "Model"
  WHERE name LIKE '%GPT-5%'
     OR name LIKE '%gpt-oss%'
     OR name LIKE '%Grok 3 mini%'
     OR name LIKE '%test%'
     OR name LIKE '%demo%'
);

-- Step 4: Delete related Pricing records
DELETE FROM "Pricing"
WHERE "model_id" IN (
  SELECT id FROM "Model"
  WHERE name LIKE '%GPT-5%'
     OR name LIKE '%gpt-oss%'
     OR name LIKE '%Grok 3 mini%'
     OR name LIKE '%test%'
     OR name LIKE '%demo%'
);

-- Step 5: Delete related ModelEndpoint records
DELETE FROM "ModelEndpoint"
WHERE "model_id" IN (
  SELECT id FROM "Model"
  WHERE name LIKE '%GPT-5%'
     OR name LIKE '%gpt-oss%'
     OR name LIKE '%Grok 3 mini%'
     OR name LIKE '%test%'
     OR name LIKE '%demo%'
);

-- Step 6: Delete related Incident records
DELETE FROM "Incident"
WHERE "model_id" IN (
  SELECT id FROM "Model"
  WHERE name LIKE '%GPT-5%'
     OR name LIKE '%gpt-oss%'
     OR name LIKE '%Grok 3 mini%'
     OR name LIKE '%test%'
     OR name LIKE '%demo%'
);

-- Step 7: Delete test models
DELETE FROM "Model"
WHERE name LIKE '%GPT-5%'
   OR name LIKE '%gpt-oss%'
   OR name LIKE '%Grok 3 mini%'
   OR name LIKE '%test%'
   OR name LIKE '%demo%'
   OR name LIKE '%example%';

-- Step 8: Show remaining models count
SELECT COUNT(*) as remaining_models FROM "Model";

-- Step 9: Show sample of remaining models
SELECT name, slug FROM "Model"
ORDER BY created_at DESC
LIMIT 10;
