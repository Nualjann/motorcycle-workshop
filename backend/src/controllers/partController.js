const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const parsePositiveNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const formatPart = (part) => ({ ...part, costPrice: Number(part.costPrice || 0), price: Number(part.price), category: part.category?.name || part.category });

const getPartErrorMessage = (error, action) => {
  console.error(`Part ${action} error:`, error);
  if (error?.code === 'P2002') return 'ข้อมูลสินค้านี้มีอยู่แล้ว';
  if (error?.code === 'P2025') return 'ไม่พบสินค้าที่ต้องการดำเนินการ';
  if (action === 'create') return 'ไม่สามารถเพิ่มสินค้าได้ กรุณาตรวจสอบข้อมูลแล้วลองใหม่';
  if (action === 'update') return 'ไม่สามารถแก้ไขสินค้าได้ กรุณาตรวจสอบข้อมูลแล้วลองใหม่';
  if (action === 'delete') return 'ไม่สามารถลบสินค้าได้ กรุณาลองใหม่อีกครั้ง';
  return 'ไม่สามารถโหลดข้อมูลสินค้าได้ กรุณาลองใหม่อีกครั้ง';
};

// ดึงอะไหล่ทั้งหมด
exports.getParts = async (req, res) => {
  try {
    const parts = await prisma.part.findMany({
      include: { category: true },
      orderBy: { id: 'desc' }
    });
    res.json(parts.map(formatPart));
  } catch (error) {
    res.status(500).json({ error: getPartErrorMessage(error, 'list') });
  }
};

// เพิ่มอะไหล่ใหม่
exports.createPart = async (req, res) => {
  try {
    const { name, category, costPrice, price, stock, imageUrl, storageLocation } = req.body;
    if (!name || !category || price === undefined || stock === undefined) {
      return res.status(400).json({ error: 'กรุณากรอกชื่อ หมวดหมู่ ราคา และจำนวนสต๊อกให้ครบ' });
    }

    const parsedPrice = parsePositiveNumber(price);
    const parsedCostPrice = parsePositiveNumber(costPrice ?? 0);
    const parsedStock = parsePositiveNumber(stock);
    if (parsedPrice === null || parsedPrice < 0 || parsedCostPrice === null || parsedCostPrice < 0 || parsedStock === null || !Number.isInteger(parsedStock) || parsedStock < 0) {
      return res.status(400).json({ error: 'ราคาหรือจำนวนสต๊อกไม่ถูกต้อง' });
    }

    let cat = await prisma.category.findUnique({ where: { name: category } });
    if (!cat) {
      cat = await prisma.category.create({ data: { name: category } });
    }

    const newPart = await prisma.part.create({
      data: {
        name,
        imageUrl: imageUrl || null,
        storageLocation: storageLocation?.trim() || null,
        costPrice: parsedCostPrice,
        price: parsedPrice,
        stock: parsedStock,
        categoryId: cat.id
      },
      include: { category: true }
    });
    res.status(201).json(formatPart(newPart));
  } catch (error) {
    res.status(500).json({ error: getPartErrorMessage(error, 'create') });
  }
};

// แก้ไขอะไหล่
exports.updatePart = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, costPrice, price, stock, imageUrl, storageLocation } = req.body;
    const partId = parseInt(id);
    if (!Number.isInteger(partId)) {
      return res.status(400).json({ error: 'รหัสอะไหล่ไม่ถูกต้อง' });
    }
    if (!name || !category || price === undefined || stock === undefined) {
      return res.status(400).json({ error: 'กรุณากรอกชื่อ หมวดหมู่ ราคา และจำนวนสต๊อกให้ครบ' });
    }

    const existing = await prisma.part.findUnique({ where: { id: partId } });
    if (!existing) {
      return res.status(404).json({ error: 'ไม่พบอะไหล่ที่ต้องการแก้ไข' });
    }

    const parsedPrice = parsePositiveNumber(price);
    const parsedCostPrice = parsePositiveNumber(costPrice ?? 0);
    const parsedStock = parsePositiveNumber(stock);
    if (parsedPrice === null || parsedPrice < 0 || parsedCostPrice === null || parsedCostPrice < 0 || parsedStock === null || !Number.isInteger(parsedStock) || parsedStock < 0) {
      return res.status(400).json({ error: 'ราคาหรือจำนวนสต๊อกไม่ถูกต้อง' });
    }

    let cat = await prisma.category.findUnique({ where: { name: category } });
    if (!cat) {
      cat = await prisma.category.create({ data: { name: category } });
    }

    const updated = await prisma.part.update({
      where: { id: partId },
      data: {
        name,
        imageUrl: imageUrl || null,
        storageLocation: storageLocation?.trim() || null,
        costPrice: parsedCostPrice,
        price: parsedPrice,
        stock: parsedStock,
        categoryId: cat.id
      },
      include: { category: true }
    });
    res.json(formatPart(updated));
  } catch (error) {
    res.status(500).json({ error: getPartErrorMessage(error, 'update') });
  }
};

// ลบอะไหล่
exports.deletePart = async (req, res) => {
  try {
    const { id } = req.params;
    const partId = parseInt(id);
    if (!Number.isInteger(partId)) {
      return res.status(400).json({ error: 'รหัสอะไหล่ไม่ถูกต้อง' });
    }

    const existing = await prisma.part.findUnique({ where: { id: partId } });
    if (!existing) {
      return res.status(404).json({ error: 'ไม่พบอะไหล่ที่ต้องการลบ' });
    }

    await prisma.part.delete({ where: { id: partId } });
    res.json({ message: 'ลบสินค้าสำเร็จ' });
  } catch (error) {
    res.status(500).json({ error: getPartErrorMessage(error, 'delete') });
  }
};

exports.importParts = async (req, res) => {
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
  if (rows.length === 0) {
    return res.status(400).json({ error: 'ไม่พบรายการสินค้าในไฟล์ที่นำเข้า' });
  }
  if (rows.length > 1000) {
    return res.status(400).json({ error: 'นำเข้าสินค้าได้ไม่เกิน 1,000 รายการต่อครั้ง' });
  }

  const errors = [];
  const validRows = [];
  const fileKeys = new Set();
  rows.forEach((row, index) => {
    const line = index + 2;
    const name = String(row.name ?? '').trim();
    const category = String(row.category ?? '').trim();
    const price = parsePositiveNumber(row.price);
    const costPrice = parsePositiveNumber(row.costPrice ?? 0);
    const stock = parsePositiveNumber(row.stock);
    const storageLocation = String(row.storageLocation ?? '').trim();
    if (!name || !category || price === null || price < 0 || costPrice === null || costPrice < 0 || stock === null || !Number.isInteger(stock) || stock < 0) {
      errors.push({ row: line, message: 'ต้องมีชื่อสินค้า หมวดหมู่ ราคา และสต็อกที่ถูกต้อง' });
      return;
    }
    const key = `${name.toLowerCase()}|${category.toLowerCase()}`;
    if (fileKeys.has(key)) {
      errors.push({ row: line, message: 'สินค้าซ้ำกับรายการในไฟล์เดียวกัน' });
      return;
    }
    fileKeys.add(key);
    validRows.push({ name, category, costPrice, price, stock, storageLocation, imageUrl: row.imageUrl || null, key, line });
  });

  let imported = 0;
  let skipped = 0;
  try {
    await prisma.$transaction(async (tx) => {
      for (const row of validRows) {
        const existing = await tx.part.findFirst({ where: { name: row.name, category: { name: row.category } } });
        if (existing) {
          skipped += 1;
          errors.push({ row: row.line, message: 'มีสินค้าชื่อนี้และหมวดหมู่นี้อยู่แล้ว จึงข้ามรายการ' });
          continue;
        }
        const category = await tx.category.upsert({
          where: { name: row.category },
          update: {},
          create: { name: row.category }
        });
        await tx.part.create({
          data: {
            name: row.name,
            categoryId: category.id,
            costPrice: row.costPrice,
            price: row.price,
            stock: row.stock,
            storageLocation: row.storageLocation || null,
            imageUrl: row.imageUrl
          }
        });
        imported += 1;
      }
    });
    return res.status(201).json({ imported, skipped, errors });
  } catch (error) {
    console.error('Part import error:', error);
    return res.status(500).json({ error: 'นำเข้าสินค้าไม่สำเร็จ กรุณาตรวจสอบข้อมูลแล้วลองใหม่' });
  }
};
