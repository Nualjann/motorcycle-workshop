const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

exports.getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    return res.json(categories.map(category => category.name));
  } catch (error) {
    console.error('Get categories error:', error);
    return res.status(500).json({ error: 'ไม่สามารถโหลดหมวดหมู่สินค้าได้' });
  }
};

exports.createCategory = async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  if (!name) {
    return res.status(400).json({ error: 'กรุณากรอกชื่อหมวดหมู่' });
  }

  try {
    const category = await prisma.category.create({ data: { name } });
    return res.status(201).json({ message: 'สร้างหมวดหมู่สำเร็จ', category: category.name });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'หมวดหมู่นี้มีอยู่ในระบบแล้ว' });
    }
    console.error('Create category error:', error);
    return res.status(500).json({ error: 'ไม่สามารถสร้างหมวดหมู่ได้' });
  }
};

exports.deleteCategory = async (req, res) => {
  const name = typeof req.params.name === 'string' ? req.params.name.trim() : '';
  if (!name) {
    return res.status(400).json({ error: 'ชื่อหมวดหมู่ไม่ถูกต้อง' });
  }

  try {
    const category = await prisma.category.findUnique({
      where: { name },
      include: { parts: { select: { id: true } } }
    });

    if (!category) {
      return res.status(404).json({ error: 'ไม่พบหมวดหมู่ที่ต้องการลบ' });
    }
    if (category.parts.length > 0) {
      return res.status(409).json({ error: 'ไม่สามารถลบหมวดหมู่ที่มีสินค้าอยู่ได้' });
    }

    await prisma.category.delete({ where: { id: category.id } });
    return res.json({ message: 'ลบหมวดหมู่สำเร็จ' });
  } catch (error) {
    console.error('Delete category error:', error);
    return res.status(500).json({ error: 'ไม่สามารถลบหมวดหมู่ได้' });
  }
};
