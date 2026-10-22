const { execFile } = require('node:child_process');

const databaseUrl = () => process.env.DATABASE_URL;

const databaseConfig = () => {
  const parsed = new URL(databaseUrl());
  return {
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: decodeURIComponent(parsed.pathname.replace(/^\//, '').split('/')[0])
  };
};

const runDatabaseCommand = (command, args, input) => new Promise((resolve, reject) => {
  const child = execFile(command, args, {
    env: process.env,
    maxBuffer: 100 * 1024 * 1024,
  }, (error, stdout, stderr) => {
    if (error) {
      const message = stderr?.trim() || error.message;
      reject(new Error(message));
      return;
    }
    resolve(stdout);
  });

  if (input !== undefined) {
    child.stdin.end(input);
  }
});

const runPostgresCommand = async (command, options) => {
  const { input, flags = [] } = options;
  try {
    return await runDatabaseCommand(command, [databaseUrl(), ...flags], input);
  } catch (localError) {
    const config = databaseConfig();
    const container = process.env.POSTGRES_CONTAINER || 'moto_postgres';
    const dockerArgs = ['exec', '-i', '-e', `PGPASSWORD=${config.password}`, container, command, '-U', config.user, '-d', config.database, ...flags];
    try {
      return await runDatabaseCommand('docker', dockerArgs, input);
    } catch (dockerError) {
      throw new Error(`ไม่พบ pg_dump/psql ในเครื่อง และไม่สามารถใช้ Docker container ${container} ได้: ${localError.message}`);
    }
  }
};

exports.downloadBackup = async (req, res) => {
  try {
    const sql = await runPostgresCommand('pg_dump', { flags: ['--no-owner', '--no-privileges'] });
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/sql; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="motofix-backup-${date}.sql"`);
    return res.send(sql);
  } catch (error) {
    console.error('Database backup error:', error);
    return res.status(500).json({ error: 'ไม่สามารถสำรองฐานข้อมูลได้ กรุณาตรวจสอบว่า PostgreSQL ติดตั้ง pg_dump แล้ว' });
  }
};

exports.restoreBackup = async (req, res) => {
  const sql = typeof req.body?.sql === 'string' ? req.body.sql : '';
  if (!sql.trim()) {
    return res.status(400).json({ error: 'กรุณาเลือกไฟล์ SQL ที่ต้องการกู้คืน' });
  }
  if (sql.length > 100 * 1024 * 1024) {
    return res.status(413).json({ error: 'ไฟล์สำรองมีขนาดใหญ่เกิน 100MB' });
  }

  try {
    await runPostgresCommand('psql', { flags: ['--no-psqlrc', '--set', 'ON_ERROR_STOP=1'], input: sql });
    return res.json({ message: 'กู้คืนฐานข้อมูลสำเร็จ' });
  } catch (error) {
    console.error('Database restore error:', error);
    return res.status(500).json({ error: 'กู้คืนฐานข้อมูลไม่สำเร็จ กรุณาตรวจสอบไฟล์ SQL และการเชื่อมต่อฐานข้อมูล' });
  }
};
