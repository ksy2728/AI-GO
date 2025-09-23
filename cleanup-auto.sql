-- Delete related records first (foreign key constraints)
DELETE FROM "ModelStatus" WHERE "model_id" IN (SELECT id FROM "Model" WHERE name LIKE '%GPT-5%' OR name LIKE '%gpt-oss%' OR name LIKE '%Grok 3 mini%');
DELETE FROM "BenchmarkScore" WHERE "model_id" IN (SELECT id FROM "Model" WHERE name LIKE '%GPT-5%' OR name LIKE '%gpt-oss%' OR name LIKE '%Grok 3 mini%');
DELETE FROM "Pricing" WHERE "model_id" IN (SELECT id FROM "Model" WHERE name LIKE '%GPT-5%' OR name LIKE '%gpt-oss%' OR name LIKE '%Grok 3 mini%');
DELETE FROM "ModelEndpoint" WHERE "model_id" IN (SELECT id FROM "Model" WHERE name LIKE '%GPT-5%' OR name LIKE '%gpt-oss%' OR name LIKE '%Grok 3 mini%');
DELETE FROM "Incident" WHERE "model_id" IN (SELECT id FROM "Model" WHERE name LIKE '%GPT-5%' OR name LIKE '%gpt-oss%' OR name LIKE '%Grok 3 mini%');

-- Delete the test models
DELETE FROM "Model" WHERE name LIKE '%GPT-5%' OR name LIKE '%gpt-oss%' OR name LIKE '%Grok 3 mini%';

-- Show result
SELECT COUNT(*) as remaining_models FROM "Model";
