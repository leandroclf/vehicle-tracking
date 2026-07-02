/* eslint-disable @typescript-eslint/no-require-imports */
// Seed idempotente de RBAC: garante os papéis padrão e atribui
// `Administrador` ao usuário indicado por ADMIN_EMAIL (default admin@yukz.com).
// dotenv é opcional: usa variáveis do ambiente quando não instalado
try { require('dotenv').config(); } catch { /* ambiente já configurado */ }
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL não está definido');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const ROLE_NAMES = ['Administrador', 'Gerente', 'Usuário'];

async function seedRbac() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@yukz.com';

  try {
    // Garantir papéis padrão (idempotente)
    for (const name of ROLE_NAMES) {
      await pool.query(
        'INSERT INTO roles (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
        [name]
      );
    }
    console.log(`Papéis garantidos: ${ROLE_NAMES.join(', ')}`);

    // Localizar usuário administrador inicial
    const userResult = await pool.query(
      'SELECT id, name FROM users WHERE email = $1',
      [adminEmail]
    );
    const adminUser = userResult.rows[0];

    if (!adminUser) {
      console.warn(`Usuário ${adminEmail} não encontrado — nenhum admin atribuído. ` +
        'Defina ADMIN_EMAIL para um usuário existente e reexecute.');
      return;
    }

    const roleResult = await pool.query(
      "SELECT id FROM roles WHERE name = 'Administrador'"
    );
    const adminRoleId = roleResult.rows[0].id;

    // Garantir profile e atribuir papel (idempotente)
    await pool.query(
      `INSERT INTO profiles (id, name, role_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET role_id = EXCLUDED.role_id`,
      [adminUser.id, adminUser.name, adminRoleId]
    );

    console.log(`Papel Administrador atribuído a ${adminEmail} (${adminUser.id})`);
  } finally {
    await pool.end();
  }
}

seedRbac().catch((error) => {
  console.error('Erro no seed de RBAC:', error);
  process.exit(1);
});
