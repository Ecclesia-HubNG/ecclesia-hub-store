-- Add category_ids array column to products for multi-category support
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_ids uuid[] DEFAULT '{}';

-- Backfill from existing category_id
UPDATE products
SET category_ids = ARRAY[category_id]
WHERE category_id IS NOT NULL AND (category_ids IS NULL OR category_ids = '{}');
