-- CreateEnum (idempotent)
DO $$ BEGIN
  CREATE TYPE "FinanceEntryKind" AS ENUM ('SALE', 'EXPENSE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "FinanceEntryStatus" AS ENUM ('PAID', 'PARTIAL', 'UNPAID', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "FinancePaymentMethod" AS ENUM ('CASH', 'DEBIT', 'CREDIT', 'PAYPAL', 'TRANSFER', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "FinanceInventoryMovementKind" AS ENUM ('PURCHASE', 'SALE', 'ADJUSTMENT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "finance_entries" (
    "id"                UUID NOT NULL DEFAULT gen_random_uuid(),
    "kind"              "FinanceEntryKind" NOT NULL,
    "entryDate"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contactId"         UUID,
    "invoiceId"         UUID,
    "receiptDocumentId" UUID,
    "createdById"       UUID,
    "counterpartyName"  TEXT,
    "category"          TEXT NOT NULL,
    "description"       TEXT,
    "quantity"          INTEGER NOT NULL DEFAULT 1,
    "amountBeforeTax"   DECIMAL(10,2) NOT NULL,
    "taxAmount"         DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalAmount"       DECIMAL(10,2) NOT NULL,
    "paymentMethod"     "FinancePaymentMethod" NOT NULL DEFAULT 'OTHER',
    "status"            "FinanceEntryStatus" NOT NULL DEFAULT 'PAID',
    "notes"             TEXT,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "finance_inventory_items" (
    "id"                 UUID NOT NULL DEFAULT gen_random_uuid(),
    "sku"                TEXT NOT NULL,
    "label"              TEXT NOT NULL,
    "description"        TEXT,
    "purchaseUnitCost"   DECIMAL(10,2) NOT NULL,
    "salePrice"          DECIMAL(10,2) NOT NULL,
    "quantityPurchased"  INTEGER NOT NULL DEFAULT 0,
    "quantitySold"       INTEGER NOT NULL DEFAULT 0,
    "quantityRemaining"  INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold"  INTEGER NOT NULL DEFAULT 0,
    "active"             BOOLEAN NOT NULL DEFAULT true,
    "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"          TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "finance_inventory_movements" (
    "id"              UUID NOT NULL DEFAULT gen_random_uuid(),
    "inventoryItemId" UUID NOT NULL,
    "financeEntryId"  UUID,
    "kind"            "FinanceInventoryMovementKind" NOT NULL,
    "quantityDelta"   INTEGER NOT NULL,
    "reason"          TEXT,
    "movedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "invoice_payment_history" (
    "id"                UUID NOT NULL DEFAULT gen_random_uuid(),
    "invoiceId"         UUID NOT NULL,
    "receiptDocumentId" UUID,
    "createdById"       UUID,
    "paidAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount"            DECIMAL(10,2) NOT NULL,
    "paymentMethod"     "FinancePaymentMethod" NOT NULL DEFAULT 'OTHER',
    "note"              TEXT,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_payment_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "finance_inventory_items_sku_key" ON "finance_inventory_items"("sku");
CREATE INDEX IF NOT EXISTS "finance_entries_kind_idx" ON "finance_entries"("kind");
CREATE INDEX IF NOT EXISTS "finance_entries_entryDate_idx" ON "finance_entries"("entryDate");
CREATE INDEX IF NOT EXISTS "finance_entries_contactId_idx" ON "finance_entries"("contactId");
CREATE INDEX IF NOT EXISTS "finance_entries_invoiceId_idx" ON "finance_entries"("invoiceId");
CREATE INDEX IF NOT EXISTS "finance_entries_category_idx" ON "finance_entries"("category");
CREATE INDEX IF NOT EXISTS "finance_entries_status_idx" ON "finance_entries"("status");
CREATE INDEX IF NOT EXISTS "finance_inventory_items_sku_idx" ON "finance_inventory_items"("sku");
CREATE INDEX IF NOT EXISTS "finance_inventory_items_active_idx" ON "finance_inventory_items"("active");
CREATE INDEX IF NOT EXISTS "finance_inventory_movements_inventoryItemId_idx" ON "finance_inventory_movements"("inventoryItemId");
CREATE INDEX IF NOT EXISTS "finance_inventory_movements_financeEntryId_idx" ON "finance_inventory_movements"("financeEntryId");
CREATE INDEX IF NOT EXISTS "finance_inventory_movements_kind_idx" ON "finance_inventory_movements"("kind");
CREATE INDEX IF NOT EXISTS "invoice_payment_history_invoiceId_idx" ON "invoice_payment_history"("invoiceId");
CREATE INDEX IF NOT EXISTS "invoice_payment_history_paidAt_idx" ON "invoice_payment_history"("paidAt");

-- AddForeignKey
ALTER TABLE "finance_entries" ADD CONSTRAINT "finance_entries_contactId_fkey"
  FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "finance_entries" ADD CONSTRAINT "finance_entries_invoiceId_fkey"
  FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "finance_entries" ADD CONSTRAINT "finance_entries_receiptDocumentId_fkey"
  FOREIGN KEY ("receiptDocumentId") REFERENCES "file_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "finance_entries" ADD CONSTRAINT "finance_entries_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "finance_inventory_movements" ADD CONSTRAINT "finance_inventory_movements_inventoryItemId_fkey"
  FOREIGN KEY ("inventoryItemId") REFERENCES "finance_inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "finance_inventory_movements" ADD CONSTRAINT "finance_inventory_movements_financeEntryId_fkey"
  FOREIGN KEY ("financeEntryId") REFERENCES "finance_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "invoice_payment_history" ADD CONSTRAINT "invoice_payment_history_invoiceId_fkey"
  FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "invoice_payment_history" ADD CONSTRAINT "invoice_payment_history_receiptDocumentId_fkey"
  FOREIGN KEY ("receiptDocumentId") REFERENCES "file_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "invoice_payment_history" ADD CONSTRAINT "invoice_payment_history_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
