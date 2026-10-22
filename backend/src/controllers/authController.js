const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

const prisma = new PrismaClient();

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

const createToken = (user) => jwt.sign(
  { id: user.id, username: user.username, role: user.role },
  JWT_SECRET,
  { expiresIn: '1d' }
);

const publicUser = (user) => ({
  id: user.id,
  username: user.username,
  name: user.name,
  role: user.role
});

exports.login = async (req, res) => {
  const username = normalizeText(req.body?.username);
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!username || !password) {
    return res.status(400).json({ error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบ' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { username } });
    const passwordMatches = user ? await bcrypt.compare(password, user.password) : false;

    if (!user || !passwordMatches) {
      return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    return res.json({
      message: 'เข้าสู่ระบบสำเร็จ',
      token: createToken(user),
      user: publicUser(user)
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'ระบบขัดข้องระหว่างเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง' });
  }
};

exports.register = async (req, res) => {
  const username = normalizeText(req.body?.username);
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const name = normalizeText(req.body?.name);
  const requestedRole = normalizeText(req.body?.role);
  const allowedRoles = ['admin', 'mechanic', 'staff'];
  if (requestedRole && !allowedRoles.includes(requestedRole)) {
    return res.status(400).json({ error: 'สิทธิ์ผู้ใช้ไม่ถูกต้อง' });
  }
  const role = requestedRole || 'staff';

  if (!username || !password || !name) {
    return res.status(400).json({ error: 'กรุณากรอกชื่อผู้ใช้ รหัสผ่าน และชื่อให้ครบ' });
  }

  if (username.length < 3 || username.length > 50) {
    return res.status(400).json({ error: 'ชื่อผู้ใช้ต้องมีความยาว 3-50 ตัวอักษร' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(409).json({ error: 'ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { username, password: hashedPassword, name, role }
    });

    return res.status(201).json({
      message: 'สมัครสมาชิกสำเร็จ',
      user: publicUser(newUser)
    });
  } catch (error) {
    console.error('Register error:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น' });
    }
    return res.status(500).json({ error: 'ระบบขัดข้องระหว่างสมัครสมาชิก กรุณาลองใหม่อีกครั้ง' });
  }
};

exports.getMe = async (req, res) => {
  const authorization = req.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนใช้งาน' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.id } });

    if (!user) {
      return res.status(404).json({ error: 'ไม่พบผู้ใช้ในระบบ' });
    }

    return res.json({ user: publicUser(user) });
  } catch (error) {
    return res.status(401).json({ error: 'โทเคนไม่ถูกต้องหรือหมดอายุแล้ว' });
  }
};

// ... โค้ดเดิม (login, getMe, register) ให้คงไว้

// 1. ดึงรายชื่อผู้ใช้ทั้งหมด (ยกเว้นรหัสผ่าน)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, name: true, role: true, createdAt: true },
      orderBy: { id: 'asc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้' });
  }
};

// 2. ลบผู้ใช้งาน
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  const userId = Number(id);
  if (!Number.isInteger(userId) || userId <= 0) return res.status(400).json({ error: 'รหัสผู้ใช้ไม่ถูกต้อง' });
  try {
    // ป้องกันการลบแอดมินคนแรก (ถ้าจำเป็น)
    const userToDelete = await prisma.user.findUnique({ where: { id: userId } });
    if (!userToDelete) return res.status(404).json({ error: 'ไม่พบผู้ใช้ที่ต้องการลบ' });
    if (userToDelete.username === 'admin') {
      return res.status(400).json({ error: 'ไม่อนุญาตให้ลบบัญชี admin หลัก' });
    }

    await prisma.user.delete({ where: { id: userId } });
    res.json({ message: 'ลบผู้ใช้งานสำเร็จ' });
  } catch (error) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบผู้ใช้งาน' });
  }
};

// 3. แก้ไขข้อมูลผู้ใช้ (ชื่อ, Role, รีเซ็ตรหัสผ่าน)
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, role, password } = req.body;
  const userId = Number(id);

  if (!Number.isInteger(userId) || userId <= 0) return res.status(400).json({ error: 'รหัสผู้ใช้ไม่ถูกต้อง' });
  if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'กรุณาระบุชื่อผู้ใช้' });

  if (!['admin', 'mechanic', 'staff'].includes(role)) {
    return res.status(400).json({ error: 'สิทธิ์ผู้ใช้ไม่ถูกต้อง' });
  }
  if (password !== undefined && password !== null && typeof password !== 'string') {
    return res.status(400).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
  }
  if (typeof password === 'string' && password.trim() !== '' && password.length < 6) {
    return res.status(400).json({ error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' });
  }

  try {
    const updateData = { name: name.trim(), role };
    
    // ถ้ายอมให้เปลี่ยนรหัสผ่านได้
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // ป้องกันการเปลี่ยน role ของแอดมินหลัก
    const userToUpdate = await prisma.user.findUnique({ where: { id: userId } });
    if (!userToUpdate) return res.status(404).json({ error: 'ไม่พบผู้ใช้ที่ต้องการแก้ไข' });
    if (userToUpdate.username === 'admin' && role !== 'admin') {
      return res.status(400).json({ error: 'ไม่อนุญาตให้เปลี่ยนสิทธิ์ของบัญชี admin หลัก' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, username: true, name: true, role: true }
    });

    res.json({ message: 'แก้ไขข้อมูลผู้ใช้งานสำเร็จ', user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลผู้ใช้งาน' });
  }
};
