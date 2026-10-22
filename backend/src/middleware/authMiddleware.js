const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { JWT_SECRET } = require('../config');

const prisma = new PrismaClient();

const authenticateToken = async (req, res, next) => {
  const authorization = req.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนใช้งาน' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) return res.status(401).json({ error: 'ไม่พบบัญชีผู้ใช้งานนี้ในระบบ' });
    req.user = { id: user.id, username: user.username, name: user.name, role: user.role };
    return next();
  } catch (error) {
    if (error?.name !== 'JsonWebTokenError' && error?.name !== 'TokenExpiredError' && error?.name !== 'NotBeforeError') {
      console.error('Authentication lookup error:', error);
      return res.status(500).json({ error: 'ไม่สามารถตรวจสอบสิทธิ์ผู้ใช้งานได้' });
    }
    return res.status(401).json({ error: 'โทเคนไม่ถูกต้องหรือหมดอายุแล้ว' });
  }
};

const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'คุณไม่มีสิทธิ์ใช้งานส่วนนี้' });
  }
  return next();
};

module.exports = { authenticateToken, requireRole };
