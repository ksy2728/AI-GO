SELECT COUNT(*) as provider_count FROM providers WHERE slug = 'anthropic';
SELECT COUNT(*) as model_count FROM models WHERE provider_id IN (SELECT id FROM providers WHERE slug = 'anthropic');
SELECT name, foundation_model FROM models WHERE provider_id IN (SELECT id FROM providers WHERE slug = 'anthropic') LIMIT 10;