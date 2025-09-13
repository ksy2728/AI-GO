-- Update NULL region values to 'global' before making the field non-nullable
UPDATE model_status
SET region = 'global'
WHERE region IS NULL;