const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');
const validJobStatuses = ['รอคิว', 'กำลังซ่อม', 'เสร็จสิ้น'];

// ฟังก์ชันจัดรูปแบบข้อมูลให้ตรงกับ Frontend
const formatJobs = (jobs) => jobs.map(j => ({
  ...j,
  date: new Date(j.createdAt).toLocaleString('th-TH'),
  wage: Number(j.wage),
  total: Number(j.total),
  partsUsed: j.partsUsed ? j.partsUsed.map(pu => ({ id: pu.partId, name: pu.part.name, costPrice: Number(pu.costPrice || 0), price: Number(pu.price), qty: pu.qty })) : [],
  partsTotal: j.partsUsed ? j.partsUsed.reduce((sum, pu) => sum + Number(pu.price) * pu.qty, 0) : 0
}));

const formatPos = (sales) => sales.map(s => ({
  ...s,
  date: new Date(s.createdAt).toLocaleString('th-TH'),
  total: Number(s.total),
  items: s.items ? s.items.map(i => ({ id: i.partId, name: i.part.name, costPrice: Number(i.costPrice || 0), price: Number(i.price), qty: i.qty })) : []
}));

const formatPublicJobs = (jobs) => jobs.map(job => ({
  id: job.id,
  tracking: job.tracking,
  plate: job.plate,
  customerName: job.customerName ? `${job.customerName.slice(0, 1)}***` : '',
  phone: 'ซ่อนข้อมูล',
  issue: job.issue,
  mechanic: job.mechanic,
  status: job.status,
  date: new Date(job.createdAt).toLocaleString('th-TH'),
  showFinancials: false
}));

// ================= งานซ่อม (Repair Jobs) =================
exports.trackJobs = async (req, res) => {
  const identifier = typeof req.query.identifier === 'string'
    ? req.query.identifier.trim()
    : typeof req.query.tracking === 'string'
      ? req.query.tracking.trim()
      : '';
  const phone = typeof req.query.phone === 'string' ? req.query.phone.trim() : '';
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const legacySearch = identifier && phone ? { phone, OR: [{ tracking: identifier }, { plate: { equals: identifier, mode: 'insensitive' } }] } : null;
  const searchValue = search || identifier;
  if (!searchValue && !legacySearch) return res.status(400).json({ error: 'กรุณาระบุทะเบียนรถหรือเบอร์โทรศัพท์' });

  try {
    const jobs = await prisma.repairJob.findMany({
      where: legacySearch || (/^\d{10}$/.test(searchValue)
        ? { phone: searchValue }
        : {
            OR: [
              { plate: { equals: searchValue, mode: 'insensitive' } },
              { tracking: searchValue }
            ]
          }),
      orderBy: { id: 'desc' }
    });
    return res.json(formatPublicJobs(jobs));
  } catch (error) {
    console.error('Track jobs error:', error);
    return res.status(500).json({ error: 'ไม่สามารถค้นหางานซ่อมได้' });
  }
};

exports.getJobs = async (req, res) => {
  try {
    const jobs = await prisma.repairJob.findMany({
      include: { partsUsed: { include: { part: true } } },
      orderBy: { id: 'desc' } // เรียงบิลล่าสุดขึ้นก่อน
    });
    res.json(formatJobs(jobs));
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'ไม่สามารถโหลดข้อมูลงานซ่อมได้' });
  }
};

exports.createJob = async (req, res) => {
  const plate = normalizeText(req.body?.plate);
  const customerName = normalizeText(req.body?.customerName);
  const phone = normalizeText(req.body?.phone);
  const issue = normalizeText(req.body?.issue);
  const mechanic = normalizeText(req.body?.mechanic) || 'ช่างเอก';
  const submittedWage = req.body?.wage;

  if (!plate || !issue) {
    return res.status(400).json({ error: 'กรุณากรอกทะเบียนรถและอาการเสียให้ครบ' });
  }
  if (!/^\d{10}$/.test(phone)) {
    return res.status(400).json({ error: 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก' });
  }
  if (submittedWage !== undefined && (!Number.isFinite(Number(submittedWage)) || Number(submittedWage) < 0)) {
    return res.status(400).json({ error: 'ค่าแรงต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป' });
  }
  if (plate.length > 30 || issue.length > 500 || customerName.length > 120 || phone.length > 30 || mechanic.length > 120) {
    return res.status(400).json({ error: 'ข้อมูลงานซ่อมยาวเกินกำหนด' });
  }

  try {
    const jobSettings = await prisma.systemSetting.findMany({ where: { key: { in: ['trackingPrefix', 'defaultWage'] } } });
    const settingMap = Object.fromEntries(jobSettings.map(setting => [setting.key, setting.value]));
    const trackingPrefix = /^[A-Za-z0-9-]{1,12}$/.test(settingMap.trackingPrefix || '') ? settingMap.trackingPrefix : 'RP';
    const defaultWage = Number(settingMap.defaultWage);
    const jobWage = submittedWage === undefined
      ? defaultWage
      : Number(submittedWage);
    const newJob = await prisma.$transaction(async (tx) => {
      // Use the database id as the sequence source so concurrent requests cannot collide.
      const created = await tx.repairJob.create({
        data: {
          tracking: `TEMP-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          plate,
          customerName,
          phone,
          issue,
          mechanic,
          status: 'รอคิว',
          wage: Number.isFinite(jobWage) && jobWage >= 0 ? jobWage : undefined,
          total: Number.isFinite(jobWage) && jobWage >= 0 ? jobWage : undefined
        }
      });
      return tx.repairJob.update({
        where: { id: created.id },
        data: { tracking: `${trackingPrefix}-${String(created.id).padStart(6, '0')}` },
        include: { partsUsed: { include: { part: true } } }
      });
    });
    res.json(formatJobs([newJob])[0]);
  } catch (error) {
    console.error('Create job error:', error);
    if (error.code === 'P2002') return res.status(409).json({ error: 'เลขที่งานซ่อมซ้ำ กรุณาลองใหม่อีกครั้ง' });
    res.status(500).json({ error: 'ไม่สามารถสร้างงานซ่อมได้ กรุณาลองใหม่อีกครั้ง' });
  }
};

exports.updateJobStatus = async (req, res) => {
  const jobId = Number(req.params.id);
  const status = normalizeText(req.body?.status);
  if (!Number.isInteger(jobId) || jobId <= 0) {
    return res.status(400).json({ error: 'รหัสงานซ่อมไม่ถูกต้อง' });
  }
  if (!validJobStatuses.includes(status)) {
    return res.status(400).json({ error: 'สถานะงานซ่อมไม่ถูกต้อง' });
  }

  try {
    const existingJob = await prisma.repairJob.findUnique({ where: { id: jobId }, select: { archived: true } });
    if (existingJob?.archived) return res.status(409).json({ error: 'งานนี้อยู่ในคลังประวัติแล้ว ไม่สามารถเปลี่ยนสถานะได้' });
    const updated = await prisma.repairJob.update({
      where: { id: jobId },
      data: { status },
      include: { partsUsed: { include: { part: true } } }
    });
    res.json(formatJobs([updated])[0]);
  } catch (error) {
    console.error('Update job status error:', error);
    if (error.code === 'P2025') return res.status(404).json({ error: 'ไม่พบงานซ่อมที่ต้องการเปลี่ยนสถานะ' });
    res.status(500).json({ error: 'ไม่สามารถเปลี่ยนสถานะงานซ่อมได้' });
  }
};

exports.updateJobIssue = async (req, res) => {
  const jobId = Number(req.params.id);
  const issue = normalizeText(req.body?.issue);
  if (!Number.isInteger(jobId) || jobId <= 0) {
    return res.status(400).json({ error: 'รหัสงานซ่อมไม่ถูกต้อง' });
  }
  if (!issue) return res.status(400).json({ error: 'กรุณาระบุอาการเสีย' });
  if (issue.length > 500) return res.status(400).json({ error: 'รายละเอียดอาการเสียยาวเกิน 500 ตัวอักษร' });

  try {
    const job = await prisma.repairJob.findUnique({ where: { id: jobId } });
    if (!job) return res.status(404).json({ error: 'ไม่พบงานซ่อมที่ต้องการแก้ไข' });
    if (job.paid || job.archived) return res.status(422).json({ error: 'ไม่สามารถแก้ไขอาการเสียของงานที่ปิดแล้วได้' });
    const updated = await prisma.repairJob.update({
      where: { id: jobId },
      data: { issue },
      include: { partsUsed: { include: { part: true } } }
    });
    return res.json(formatJobs([updated])[0]);
  } catch (error) {
    console.error('Update job issue error:', error);
    return res.status(500).json({ error: 'ไม่สามารถแก้ไขอาการเสียได้' });
  }
};

exports.archiveJob = async (req, res) => {
  const jobId = Number(req.params.id);
  if (!Number.isInteger(jobId) || jobId <= 0) {
    return res.status(400).json({ error: 'รหัสงานซ่อมไม่ถูกต้อง' });
  }

  try {
    const job = await prisma.repairJob.findUnique({ where: { id: jobId } });
    if (!job) return res.status(404).json({ error: 'ไม่พบงานซ่อมที่ต้องการเก็บเข้าประวัติ' });
    if (!job.paid) return res.status(422).json({ error: 'กรุณาชำระเงินก่อนเก็บงานเข้าประวัติ' });
    if (job.status !== 'เสร็จสิ้น') return res.status(422).json({ error: 'เก็บเข้าประวัติได้เฉพาะงานที่มีสถานะเสร็จสิ้น' });
    const updated = await prisma.repairJob.update({ where: { id: jobId }, data: { archived: true } });
    return res.json(updated);
  } catch (error) {
    console.error('Archive job error:', error);
    return res.status(500).json({ error: 'ไม่สามารถเก็บงานซ่อมเข้าประวัติได้' });
  }
};

exports.closeJob = async (req, res) => {
  const jobId = Number(req.params.id);
  const wage = Number(req.body?.wage);
  const paymentMethod = normalizeText(req.body?.paymentMethod);
  const paymentTransRef = normalizeText(req.body?.paymentTransRef);
  const allowedPaymentMethods = ['เงินสด', 'โอนจ่าย'];
  if (!Number.isInteger(jobId) || jobId <= 0) {
    return res.status(400).json({ error: 'รหัสงานซ่อมไม่ถูกต้อง' });
  }
  if (!Number.isFinite(wage) || wage < 0) {
    return res.status(400).json({ error: 'ค่าแรงต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป' });
  }
  if (!allowedPaymentMethods.includes(paymentMethod)) {
    return res.status(400).json({ error: 'วิธีชำระเงินไม่ถูกต้อง' });
  }
  if (paymentMethod === 'โอนจ่าย' && !paymentTransRef) {
    return res.status(422).json({ error: 'กรุณาตรวจสอบสลิปก่อนปิดงานซ่อม' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existingJob = await tx.repairJob.findUnique({ where: { id: jobId }, include: { partsUsed: true } });
      if (!existingJob) return { type: 'job-not-found' };
      if (existingJob.paid || existingJob.archived) return { type: 'job-closed' };
      const partsTotal = existingJob.partsUsed.reduce((sum, part) => sum + Number(part.price) * part.qty, 0);
      const total = partsTotal + wage;

      if (paymentMethod === 'โอนจ่าย') {
        const verification = await tx.paymentVerification.findUnique({ where: { transRef: paymentTransRef } });
        if (!verification || verification.usedAt || Math.abs(Number(verification.amount) - total) > 0.01) {
          return { type: 'payment-not-verified' };
        }
      }

      const updated = await tx.repairJob.updateMany({
        where: { id: jobId, paid: false },
        data: {
          status: 'เสร็จสิ้น',
          paid: true,
          wage,
          total,
          paymentMethod,
          paymentTransRef: paymentMethod === 'โอนจ่าย' ? paymentTransRef : null
        }
      });

      if (updated.count !== 1) return { type: 'job-closed' };
      if (paymentMethod === 'โอนจ่าย') {
        const consumed = await tx.paymentVerification.updateMany({
          where: { transRef: paymentTransRef, usedAt: null },
          data: { usedAt: new Date() }
        });
        if (consumed.count !== 1) throw Object.assign(new Error('Payment verification was already used'), { code: 'PAYMENT_NOT_VERIFIED' });
      }
      const job = await tx.repairJob.findUnique({
        where: { id: jobId },
        include: { partsUsed: { include: { part: true } } }
      });
      return { type: 'success', job };
    });

    if (result.type === 'job-not-found') {
      return res.status(404).json({ error: 'ไม่พบงานซ่อมที่ต้องการปิด' });
    }
    if (result.type === 'job-closed') {
      return res.status(409).json({ error: 'งานซ่อมนี้ปิดและชำระเงินแล้ว ไม่สามารถปิดซ้ำได้' });
    }
    if (result.type === 'payment-not-verified') {
      return res.status(422).json({ error: 'ไม่พบสลิปที่ตรวจสอบผ่าน หรือยอดเงินในสลิปไม่ตรงกับยอดงานซ่อม' });
    }
    return res.json(formatJobs([result.job])[0]);
  } catch (error) {
    console.error('Close job error:', error);
    if (error.code === 'PAYMENT_NOT_VERIFIED') {
      return res.status(422).json({ error: 'สลิปถูกใช้งานแล้วหรือไม่สามารถยืนยันการชำระเงินได้' });
    }
    return res.status(500).json({ error: 'ไม่สามารถปิดงานซ่อมได้ กรุณาลองใหม่อีกครั้ง' });
  }
};

// ================= ขายหน้าร้าน (POS) =================
exports.getPosSales = async (req, res) => {
  try {
    const sales = await prisma.posSale.findMany({
      include: { items: { include: { part: true } } },
      orderBy: { id: 'desc' }
    });
    res.json(formatPos(sales));
  } catch (error) {
    console.error('Get POS sales error:', error);
    res.status(500).json({ error: 'ไม่สามารถโหลดข้อมูลการขายได้' });
  }
};

exports.createPosSale = async (req, res) => {
  const { items, paymentMethod } = req.body || {};
  const paymentTransRef = normalizeText(req.body?.paymentTransRef);
  const allowedPaymentMethods = ['เงินสด', 'โอนจ่าย'];

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'กรุณาเลือกรายการสินค้าอย่างน้อย 1 รายการ' });
  }
  if (!allowedPaymentMethods.includes(paymentMethod)) {
    return res.status(400).json({ error: 'วิธีชำระเงินไม่ถูกต้อง' });
  }
  if (paymentMethod === 'โอนจ่าย' && !paymentTransRef) {
    return res.status(422).json({ error: 'กรุณาตรวจสอบสลิปก่อนบันทึกการขาย' });
  }

  const quantities = new Map();
  for (const item of items) {
    const partId = Number(item?.id);
    const qty = Number(item?.qty);
    if (!Number.isInteger(partId) || partId <= 0 || !Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({ error: 'รายการสินค้าหรือจำนวนไม่ถูกต้อง' });
    }
    quantities.set(partId, (quantities.get(partId) || 0) + qty);
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const requestedItems = [...quantities.entries()].map(([partId, qty]) => ({ partId, qty }));
      const parts = await tx.part.findMany({
        where: { id: { in: requestedItems.map(item => item.partId) } }
      });
      const partById = new Map(parts.map(part => [part.id, part]));

      for (const item of requestedItems) {
        const part = partById.get(item.partId);
        if (!part) return { type: 'part-not-found', partId: item.partId };
        if (part.stock < item.qty) {
          return { type: 'out-of-stock', partId: item.partId, available: part.stock };
        }
      }

      const total = requestedItems.reduce((sum, item) => {
        const part = partById.get(item.partId);
        return sum + (Number(part.price) * item.qty);
      }, 0);
      if (paymentMethod === 'โอนจ่าย') {
        const verification = await tx.paymentVerification.findUnique({ where: { transRef: paymentTransRef } });
        if (!verification || verification.usedAt || Math.abs(Number(verification.amount) - total) > 0.01) {
          return { type: 'payment-not-verified' };
        }
      }
      const receiptNo = `POS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const sale = await tx.posSale.create({
        data: {
          receiptNo,
          paymentMethod,
          paymentTransRef: paymentMethod === 'โอนจ่าย' ? paymentTransRef : null,
          total,
          items: {
            create: requestedItems.map(item => ({
              partId: item.partId,
              qty: item.qty,
              costPrice: partById.get(item.partId).costPrice,
              price: partById.get(item.partId).price
            }))
          }
        },
        include: { items: { include: { part: true } } }
      });

      for (const item of requestedItems) {
        const updated = await tx.part.updateMany({
          where: { id: item.partId, stock: { gte: item.qty } },
          data: { stock: { decrement: item.qty } }
        });
        if (updated.count !== 1) {
          throw Object.assign(new Error('สต็อกสินค้าเปลี่ยนแปลงระหว่างทำรายการ'), { code: 'POS_STOCK_CHANGED' });
        }
      }

      if (paymentMethod === 'โอนจ่าย') {
        const consumed = await tx.paymentVerification.updateMany({
          where: { transRef: paymentTransRef, usedAt: null },
          data: { usedAt: new Date() }
        });
        if (consumed.count !== 1) throw Object.assign(new Error('Payment verification was already used'), { code: 'PAYMENT_NOT_VERIFIED' });
      }

      return { sale };
    });

    if (result.type === 'part-not-found') {
      return res.status(404).json({ error: 'ไม่พบสินค้าที่เลือก' });
    }
    if (result.type === 'out-of-stock') {
      return res.status(422).json({ error: 'สินค้าในสต็อกไม่เพียงพอ กรุณาตรวจสอบจำนวนอีกครั้ง' });
    }
    if (result.type === 'payment-not-verified') {
      return res.status(422).json({ error: 'ไม่พบสลิปที่ตรวจสอบผ่าน หรือยอดเงินในสลิปไม่ตรงกับยอดขาย' });
    }
    return res.status(201).json(formatPos([result.sale])[0]);
  } catch (error) {
    console.error('Create POS sale error:', error);
    if (error.code === 'POS_STOCK_CHANGED') {
      return res.status(409).json({ error: 'สต็อกสินค้าเปลี่ยนแปลง กรุณาลองทำรายการใหม่' });
    }
    if (error.code === 'PAYMENT_NOT_VERIFIED') {
      return res.status(422).json({ error: 'สลิปถูกใช้งานแล้วหรือไม่สามารถยืนยันการชำระเงินได้' });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'เลขที่ใบเสร็จซ้ำ กรุณาลองใหม่อีกครั้ง' });
    }
    return res.status(500).json({ error: 'ไม่สามารถบันทึกการขายได้ กรุณาลองใหม่อีกครั้ง' });
  }
};

// ================= ข้อมูลพนักงาน (Users) =================
exports.getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, role: true } // ดึงมาแค่ชื่อและสิทธิ์ (ไม่ดึงรหัสผ่าน)
    });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้' });
  }
};
