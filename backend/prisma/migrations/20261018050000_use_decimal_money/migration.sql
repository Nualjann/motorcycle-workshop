ALTER TABLE "Part" ALTER COLUMN "price" TYPE DECIMAL(12,2) USING ROUND("price"::numeric, 2);
ALTER TABLE "RepairJob" ALTER COLUMN "wage" TYPE DECIMAL(12,2) USING ROUND("wage"::numeric, 2);
ALTER TABLE "RepairJob" ALTER COLUMN "total" TYPE DECIMAL(12,2) USING ROUND("total"::numeric, 2);
ALTER TABLE "RepairPartUsed" ALTER COLUMN "price" TYPE DECIMAL(12,2) USING ROUND("price"::numeric, 2);
ALTER TABLE "PosSale" ALTER COLUMN "total" TYPE DECIMAL(12,2) USING ROUND("total"::numeric, 2);
ALTER TABLE "PosSaleItem" ALTER COLUMN "price" TYPE DECIMAL(12,2) USING ROUND("price"::numeric, 2);
ALTER TABLE "PaymentVerification" ALTER COLUMN "amount" TYPE DECIMAL(12,2) USING ROUND("amount"::numeric, 2);
