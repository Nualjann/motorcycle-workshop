const express = require('express');
const cors = require('cors');
require('dotenv').config();

const apiRoutes = require('./routes/apiRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:4173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '20mb' }));

// Main API Route
app.use('/api', apiRoutes);

app.use((error, req, res, next) => {
  console.error('Unhandled API error:', error);
  if (res.headersSent) return next(error);
  if (error?.code === 'P2002') {
    return res.status(409).json({ error: 'ข้อมูลซ้ำ ไม่สามารถบันทึกได้' });
  }
  if (error?.code === 'P2025') {
    return res.status(404).json({ error: 'ไม่พบข้อมูลที่ต้องการ' });
  }
  return res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง' });
});

app.get('/', (req, res) => {
  res.send('MotoFix Workshop API is Running...');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
