const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hashPassword = await bcrypt.hash('admin1234', 10);
  const hashStaffPassword = await bcrypt.hash('staff1234', 10);

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashPassword,
      name: 'ผู้จัดการร้าน (Admin)',
      role: 'admin'
    }
  });

  await prisma.user.upsert({
    where: { username: 'staff1' },
    update: { role: 'mechanic' },
    create: {
      username: 'staff1',
      password: hashStaffPassword,
      name: 'ช่างเอก (Staff)',
      role: 'mechanic'
    }
  });

  console.log('✅ สร้างบัญชีผู้ใช้เริ่มต้นสำเร็จ!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
