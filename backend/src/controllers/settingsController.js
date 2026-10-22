const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DEFAULTS = {
  storeName: 'MotoFix Workshop',
  storeAddress: '',
  storePhone: '',
  taxId: '',
  receiptFooter: 'ขอบคุณที่ใช้บริการ',
  bankName: '',
  bankAccountName: '',
  bankAccountNumber: '',
  paperSize: '80mm',
  warrantyDays: '7',
  defaultWage: '100',
  trackingPrefix: 'RP',
  themeColor: 'blue',
  lowStockThreshold: '2'
};

const allowedKeys = new Set(Object.keys(DEFAULTS));

const getSettings = async () => {
  const rows = await prisma.systemSetting.findMany();
  const settings = rows.reduce((result, row) => ({ ...result, [row.key]: row.value }), { ...DEFAULTS });
  settings.updatedAt = rows.reduce((latest, row) => row.updatedAt > latest ? row.updatedAt : latest, new Date(0));
  return settings;
};

exports.getSettings = async (req, res) => {
  try {
    return res.json(await getSettings());
  } catch (error) {
    console.error('Get settings error:', error);
    return res.status(500).json({ error: 'ไม่สามารถโหลดการตั้งค่าระบบได้' });
  }
};

exports.updateSettings = async (req, res) => {
  const input = req.body && typeof req.body === 'object' ? req.body : {};
  const updates = Object.entries(input).filter(([key, value]) => allowedKeys.has(key) && typeof value === 'string');

  if (updates.length === 0) {
    return res.status(400).json({ error: 'ไม่พบข้อมูลการตั้งค่าที่ต้องการบันทึก' });
  }
  if (input.themeColor !== undefined && !['blue', 'emerald', 'orange', 'red'].includes(input.themeColor) && !/^#[0-9A-Fa-f]{6}$/.test(input.themeColor)) {
    return res.status(400).json({ error: 'สีธีมไม่ถูกต้อง' });
  }
  if (input.lowStockThreshold !== undefined && (!/^\d+$/.test(input.lowStockThreshold) || Number(input.lowStockThreshold) > 100000)) {
    return res.status(400).json({ error: 'จำนวนสต็อกขั้นต่ำไม่ถูกต้อง' });
  }
  if (input.paperSize !== undefined && !['80mm', 'a4'].includes(input.paperSize)) {
    return res.status(400).json({ error: 'รูปแบบกระดาษไม่ถูกต้อง' });
  }
  for (const key of ['warrantyDays', 'defaultWage']) {
    if (input[key] !== undefined && (!/^\d+(\.\d+)?$/.test(input[key]) || Number(input[key]) > 100000)) {
      return res.status(400).json({ error: 'ค่าตั้งงานซ่อมไม่ถูกต้อง' });
    }
  }
  if (input.trackingPrefix !== undefined && !/^[A-Za-z0-9-]{1,12}$/.test(input.trackingPrefix)) {
    return res.status(400).json({ error: 'คำนำหน้าเลขใบงานไม่ถูกต้อง' });
  }

  try {
    await prisma.$transaction(updates.map(([key, value]) => prisma.systemSetting.upsert({
      where: { key },
      update: { value: value.trim() },
      create: { key, value: value.trim() }
    })));
    return res.json({ message: 'บันทึกการตั้งค่าสำเร็จ', settings: await getSettings() });
  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({ error: 'ไม่สามารถบันทึกการตั้งค่าได้' });
  }
};
