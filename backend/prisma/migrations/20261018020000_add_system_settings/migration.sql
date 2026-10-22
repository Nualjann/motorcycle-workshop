CREATE TABLE "SystemSetting" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

INSERT INTO "SystemSetting" ("key", "value", "updatedAt") VALUES
  ('storeName', 'MotoFix Workshop', CURRENT_TIMESTAMP),
  ('storeAddress', '', CURRENT_TIMESTAMP),
  ('storePhone', '', CURRENT_TIMESTAMP),
  ('taxId', '', CURRENT_TIMESTAMP),
  ('receiptFooter', 'ขอบคุณที่ใช้บริการ', CURRENT_TIMESTAMP),
  ('bankName', '', CURRENT_TIMESTAMP),
  ('bankAccountName', '', CURRENT_TIMESTAMP),
  ('bankAccountNumber', '', CURRENT_TIMESTAMP),
  ('promptPayNumber', '', CURRENT_TIMESTAMP),
  ('themeColor', 'blue', CURRENT_TIMESTAMP),
  ('lowStockThreshold', '2', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
