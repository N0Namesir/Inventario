require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const usuarios = [
  { nombre: 'Super Admin', email: 'super@fastech.com', password: 'super123',   rol: 'superadmin' },
  { nombre: 'Administrador', email: 'admin@fastech.com', password: 'admin123', rol: 'admin'      },
  { nombre: 'Cliente Demo', email: 'cliente@fastech.com', password: 'cliente123', rol: 'cliente' },
];

async function seed() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  for (const u of usuarios) {
    const hash = await bcrypt.hash(u.password, 10);
    await db.execute(
      'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE id=id',
      [u.nombre, u.email, hash, u.rol]
    );
    console.log(`✓ ${u.rol}: ${u.email} / ${u.password}`);
  }

  await db.end();
  console.log('\nSeed completado.');
}

seed().catch(console.error);
