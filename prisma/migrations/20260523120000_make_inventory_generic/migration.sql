-- Add generic inventory category and safer low-stock default
ALTER TABLE "finance_inventory_items"
  ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'OTHER';

ALTER TABLE "finance_inventory_items"
  ALTER COLUMN "lowStockThreshold" SET DEFAULT 3;

CREATE INDEX IF NOT EXISTS "finance_inventory_items_category_idx"
  ON "finance_inventory_items"("category");
