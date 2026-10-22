const dataUrlToBlob = (value) => {
  const match = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(value || '');
  if (!match) return null;
  return new Blob([Buffer.from(match[2], 'base64')], { type: match[1] });
};

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.verifySlip = async (req, res) => {
  const { slipImage, amount } = req.body || {};
  const expectedAmount = Number(amount);
  if (!slipImage || !Number.isFinite(expectedAmount) || expectedAmount <= 0) {
    return res.status(400).json({ error: 'กรุณาแนบสลิปและระบุยอดเงินที่ถูกต้อง' });
  }
  const slipokApiKey = process.env.SLIPOK_API_KEY?.trim();
  const slipokBranchId = process.env.SLIPOK_BRANCH_ID?.trim();
  if (!slipokApiKey || !slipokBranchId) {
    return res.status(503).json({ error: 'ยังไม่ได้ตั้งค่า SlipOK API Key หรือ Branch ID' });
  }
  if (/^https?:\/\//i.test(slipokBranchId) || /[/?#]/.test(slipokBranchId)) {
    return res.status(503).json({ error: 'ค่า SlipOK Branch ID ไม่ถูกต้อง ต้องใส่เฉพาะรหัสสาขา ไม่ใช่ URL หรือ https://' });
  }

  const slip = dataUrlToBlob(slipImage);
  if (!slip) return res.status(400).json({ error: 'ไฟล์สลิปต้องเป็นรูปภาพ JPG, PNG หรือ WEBP' });

  try {
    const form = new FormData();
    form.append('files', slip, 'slip.jpg');
    form.append('amount', String(expectedAmount));
    form.append('log', 'true');
    const response = await fetch(`https://api.slipok.com/api/line/apikey/${encodeURIComponent(slipokBranchId)}`, {
      method: 'POST',
      headers: { 'x-authorization': slipokApiKey },
      body: form,
      signal: AbortSignal.timeout(20000)
    });
    const responseText = await response.text();
    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      console.error('SlipOK returned non-JSON response:', response.status, responseText.slice(0, 300));
      return res.status(502).json({ error: 'SlipOK ส่งข้อมูลกลับมาไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' });
    }
    const actualAmount = Number(result.data?.amount);
    if (Number.isFinite(actualAmount) && Math.abs(actualAmount - expectedAmount) > 0.01) {
      const difference = Math.abs(actualAmount - expectedAmount).toFixed(2);
      return res.status(422).json({
        error: actualAmount > expectedAmount
          ? `ยอดเงินในสลิปเกิน ยอดที่ต้องชำระ ฿${expectedAmount.toFixed(2)} แต่สลิปเป็น ฿${actualAmount.toFixed(2)} (เกิน ฿${difference})`
          : `ยอดเงินในสลิปขาด ยอดที่ต้องชำระ ฿${expectedAmount.toFixed(2)} แต่สลิปเป็น ฿${actualAmount.toFixed(2)} (ขาด ฿${difference})`
      });
    }
    if (!response.ok) {
      return res.status(422).json({ error: result.data?.message || result.message || `SlipOK ปฏิเสธคำขอ (HTTP ${response.status})` });
    }
    const verified = response.ok && result.success === true && result.data?.success === true && Number(result.data?.amount) === expectedAmount;
    if (!verified) return res.status(422).json({ error: result.data?.message || 'สลิปปลอมหรือสลิปไม่ผ่านการตรวจสอบ' });
    if (!result.data.transRef) {
      return res.status(422).json({ error: 'ไม่พบเลขอ้างอิงธุรกรรมในสลิป' });
    }
    try {
      await prisma.paymentVerification.create({
        data: { transRef: result.data.transRef, amount: Number(result.data.amount) }
      });
    } catch (error) {
      if (error.code === 'P2002') return res.status(409).json({ error: 'สลิปนี้เคยตรวจสอบหรือใช้งานแล้ว' });
      throw error;
    }
    return res.json({ verified: true, amount: result.data.amount, transRef: result.data.transRef, message: 'ตรวจสอบสลิปสำเร็จ' });
  } catch (error) {
    console.error('Verify slip error:', error);
    if (error?.cause?.code === 'EACCES' || error?.cause?.code === 'ENETUNREACH' || error?.code === 'ENETUNREACH') {
      return res.status(502).json({ error: 'เซิร์ฟเวอร์ไม่สามารถเชื่อมต่อ SlipOK ได้ กรุณาตรวจสอบอินเทอร์เน็ตหรือการอนุญาตให้ Backend เชื่อมต่อภายนอก' });
    }
    return res.status(502).json({ error: 'ไม่สามารถเชื่อมต่อ SlipOK ได้ กรุณาลองใหม่' });
  }
};
