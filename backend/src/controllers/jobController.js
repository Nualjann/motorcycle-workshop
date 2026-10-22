const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const parsePositiveInt = (value) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
};

exports.usePartInJob = async (req, res) => {
  const jobId = parsePositiveInt(req.body?.jobId);
  const partId = parsePositiveInt(req.body?.partId);

  if (jobId === null || partId === null) {
    return res.status(400).json({ error: 'รหัสงานและรหัสอะไหล่ต้องเป็นตัวเลขที่ถูกต้อง' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const job = await tx.repairJob.findUnique({
        where: { id: jobId },
        include: { partsUsed: true }
      });
      if (!job) return { type: 'job-not-found' };
      if (job.paid || job.archived) return { type: 'job-closed' };

      const part = await tx.part.findUnique({ where: { id: partId } });
      if (!part) return { type: 'part-not-found' };
      if (part.stock < 1) return { type: 'out-of-stock' };

      const stockUpdated = await tx.part.updateMany({
        where: { id: partId, stock: { gte: 1 } },
        data: { stock: { decrement: 1 } }
      });
      if (stockUpdated.count !== 1) return { type: 'out-of-stock' };

      const existing = await tx.repairPartUsed.findFirst({
        where: { jobId, partId }
      });

      if (existing) {
        await tx.repairPartUsed.update({
          where: { id: existing.id },
          data: { qty: { increment: 1 } }
        });
      } else {
        await tx.repairPartUsed.create({
          data: { jobId, partId, qty: 1, costPrice: part.costPrice, price: part.price }
        });
      }

      if (!job) return { type: 'job-not-found' };

      const usedParts = await tx.repairPartUsed.findMany({ where: { jobId } });
      const partsTotal = usedParts.reduce((sum, item) => sum + Number(item.price) * item.qty, 0);

      const updatedJob = await tx.repairJob.update({
        where: { id: jobId },
        data: { total: partsTotal + Number(job.wage) },
        include: { partsUsed: { include: { part: true } } }
      });
      return {
        ...updatedJob,
        wage: Number(updatedJob.wage),
        total: Number(updatedJob.total),
        partsTotal,
        partsUsed: updatedJob.partsUsed.map(used => ({
          id: used.partId,
          name: used.part.name,
          price: Number(used.price),
          qty: used.qty
        }))
      };
    });

    if (result?.type === 'job-not-found') {
      return res.status(404).json({ error: 'ไม่พบงานซ่อมที่ระบุ' });
    }
    if (result?.type === 'part-not-found') {
      return res.status(404).json({ error: 'ไม่พบอะไหล่ที่ระบุ' });
    }
    if (result?.type === 'out-of-stock') {
      return res.status(422).json({ error: 'อะไหล่หมดสต็อก' });
    }

    if (result?.type === 'job-closed') return res.status(409).json({ error: 'งานซ่อมนี้ปิดและชำระเงินแล้ว ไม่สามารถเบิกอะไหล่เพิ่มได้' });
    return res.json(result);
  } catch (error) {
    console.error('Use part in job error:', error);
    return res.status(500).json({ error: 'ไม่สามารถเพิ่มอะไหล่ในงานซ่อมได้' });
  }
};

exports.removePartFromJob = async (req, res) => {
  const jobId = parsePositiveInt(req.body?.jobId);
  const partId = parsePositiveInt(req.body?.partId);

  if (jobId === null || partId === null) {
    return res.status(400).json({ error: 'รหัสงานและรหัสอะไหล่ต้องเป็นตัวเลขที่ถูกต้อง' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const job = await tx.repairJob.findUnique({ where: { id: jobId } });
      if (!job) return { type: 'job-not-found' };
      if (job.paid || job.archived) return { type: 'job-closed' };

      const usedPart = await tx.repairPartUsed.findFirst({ where: { jobId, partId } });
      if (!usedPart) return { type: 'usage-not-found' };

      await tx.part.update({ where: { id: partId }, data: { stock: { increment: 1 } } });
      if (usedPart.qty === 1) {
        await tx.repairPartUsed.delete({ where: { id: usedPart.id } });
      } else {
        await tx.repairPartUsed.update({ where: { id: usedPart.id }, data: { qty: { decrement: 1 } } });
      }

      const remainingParts = await tx.repairPartUsed.findMany({ where: { jobId } });
      const partsTotal = remainingParts.reduce((sum, item) => sum + Number(item.price) * item.qty, 0);
      const updatedJob = await tx.repairJob.update({
        where: { id: jobId },
        data: { total: partsTotal + Number(job.wage) },
        include: { partsUsed: { include: { part: true } } }
      });
      return {
        ...updatedJob,
        wage: Number(updatedJob.wage),
        total: Number(updatedJob.total),
        partsTotal,
        partsUsed: updatedJob.partsUsed.map(used => ({
          id: used.partId,
          name: used.part.name,
          price: Number(used.price),
          qty: used.qty
        }))
      };
    });

    if (result.type === 'job-not-found') return res.status(404).json({ error: 'ไม่พบงานซ่อมที่ระบุ' });
    if (result.type === 'job-closed') return res.status(409).json({ error: 'งานซ่อมนี้ปิดและชำระเงินแล้ว ไม่สามารถแก้ไขรายการอะไหล่ได้' });
    if (result.type === 'usage-not-found') return res.status(404).json({ error: 'ไม่พบอะไหล่รายการนี้ในงานซ่อม' });
    return res.json(result);
  } catch (error) {
    console.error('Remove part from job error:', error);
    return res.status(500).json({ error: 'ไม่สามารถแก้ไขรายการอะไหล่ในงานซ่อมได้' });
  }
};
