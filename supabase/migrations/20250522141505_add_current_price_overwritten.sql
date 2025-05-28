-- Add current_price_overwritten column to assets table
ALTER TABLE assets ADD COLUMN current_price_overwritten boolean DEFAULT false;

-- Migrate any existing data
UPDATE assets SET current_price_overwritten = false WHERE current_price_overwritten IS NULL; 