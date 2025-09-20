-- Check models with AA data
SELECT
    COUNT(*) as total_models,
    SUM(CASE WHEN intelligence_score IS NOT NULL AND intelligence_score > 0 THEN 1 ELSE 0 END) as models_with_intelligence,
    SUM(CASE WHEN output_speed IS NOT NULL AND output_speed > 0 THEN 1 ELSE 0 END) as models_with_speed,
    SUM(CASE WHEN input_price IS NOT NULL OR output_price IS NOT NULL THEN 1 ELSE 0 END) as models_with_price
FROM models;

-- Show sample of models with AA data
SELECT
    name,
    intelligence_score,
    output_speed,
    input_price,
    output_price
FROM models
WHERE intelligence_score IS NOT NULL
   OR output_speed IS NOT NULL
   OR input_price IS NOT NULL
   OR output_price IS NOT NULL
LIMIT 10;