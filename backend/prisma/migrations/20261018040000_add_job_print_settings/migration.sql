INSERT INTO "SystemSetting" ("key", "value", "updatedAt") VALUES
  ('paperSize', '80mm', CURRENT_TIMESTAMP),
  ('warrantyDays', '7', CURRENT_TIMESTAMP),
  ('defaultWage', '100', CURRENT_TIMESTAMP),
  ('trackingPrefix', 'RP', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
