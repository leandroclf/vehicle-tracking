/**
 * Suíte de integração (post-baseline-hardening, tarefa 4.1).
 * Exercita os route handlers reais contra um PostgreSQL real:
 *   docker compose -f docker-compose.dev.yml up -d postgres
 *   pnpm run test:integration
 */
import { NextRequest } from 'next/server';
import { getDbPool, closePool } from '@/lib/database';
import { POST as registerHandler } from '@/app/api/auth/register/route';
import { POST as loginHandler } from '@/app/api/auth/login/route';
import { GET as vehiclesGet, POST as vehiclesPost } from '@/app/api/vehicles/route';
import { POST as commandsPost, GET as commandsGet } from '@/app/api/commands/route';
import { POST as confirmPost } from '@/app/api/commands/confirm/route';
import { GET as alertsGet, PATCH as alertsPatch } from '@/app/api/alerts/route';
import { GET as usersGet } from '@/app/api/users/route';
import { GET as notificationsGet, PATCH as notificationsPatch } from '@/app/api/notifications/route';
import { GET as settingsGet, PUT as settingsPut } from '@/app/api/settings/route';
import { POST as reportsPost, GET as reportsGet } from '@/app/api/reports/route';

const RUN = `it${Date.now()}`;
const USER_EMAIL = `${RUN}@integration.test`;
const ADMIN_EMAIL = `${RUN}-admin@integration.test`;
const PASSWORD = 'Integration#123';

let token = '';
let userId = '';
let adminToken = '';
let adminUserId = '';
let vehicleId = 0;

function jsonRequest(url: string, options: {
  method?: string;
  body?: unknown;
  token?: string;
} = {}): NextRequest {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  return new NextRequest(`http://localhost${url}`, {
    method: options.method || 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}

beforeAll(async () => {
  // Sanidade: banco acessível e migrado
  const pool = getDbPool();
  const tables = await pool.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
  );
  const names = tables.rows.map((row: { table_name: string }) => row.table_name);
  for (const required of ['users', 'vehicles', 'commands', 'alerts', 'roles', 'notifications', 'user_settings', 'reports']) {
    expect(names).toContain(required);
  }
});

afterAll(async () => {
  // Limpeza dos dados criados pela suíte (cascade cobre dependentes)
  const pool = getDbPool();
  await pool.query('DELETE FROM users WHERE email LIKE $1', [`${RUN}%`]);
  await closePool();
});

describe('auth', () => {
  it('registra um usuário novo e retorna token', async () => {
    const response = await registerHandler(jsonRequest('/api/auth/register', {
      method: 'POST',
      body: { email: USER_EMAIL, password: PASSWORD, name: 'Usuário Integração' },
    }));
    expect(response.status).toBe(200);
    const body = await response.json() as { token: string; user: { id: string } };
    expect(body.token).toBeTruthy();
    token = body.token;
    userId = body.user.id;
  });

  it('autentica com credenciais válidas', async () => {
    const response = await loginHandler(jsonRequest('/api/auth/login', {
      method: 'POST',
      body: { email: USER_EMAIL, password: PASSWORD },
    }));
    expect(response.status).toBe(200);
    const body = await response.json() as { token: string };
    expect(body.token).toBeTruthy();
  });

  it('rejeita credenciais inválidas', async () => {
    const response = await loginHandler(jsonRequest('/api/auth/login', {
      method: 'POST',
      body: { email: USER_EMAIL, password: 'senha-errada' },
    }));
    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});

describe('vehicles', () => {
  it('exige autenticação', async () => {
    const response = await vehiclesGet(jsonRequest('/api/vehicles'));
    expect(response.status).toBe(401);
  });

  it('cria um veículo', async () => {
    const response = await vehiclesPost(jsonRequest('/api/vehicles', {
      method: 'POST',
      token,
      body: { name: `Caminhão ${RUN}`, licensePlate: `INT${RUN.slice(-4)}`, model: 'Teste', status: 'active' },
    }));
    expect(response.status).toBe(201);
    const body = await response.json() as { id: number };
    expect(body.id).toBeGreaterThan(0);
    vehicleId = body.id;
  });

  it('rejeita placa duplicada', async () => {
    const response = await vehiclesPost(jsonRequest('/api/vehicles', {
      method: 'POST',
      token,
      body: { name: `Duplicado ${RUN}`, licensePlate: `INT${RUN.slice(-4)}`, model: 'Teste' },
    }));
    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it('lista os veículos do usuário', async () => {
    const response = await vehiclesGet(jsonRequest('/api/vehicles', { token }));
    expect(response.status).toBe(200);
    const body = await response.json() as { vehicles: Array<{ id: number }> };
    expect(body.vehicles.some(v => v.id === vehicleId)).toBe(true);
  });
});

describe('commands', () => {
  let commandId = '';
  let confirmationToken = '';

  it('cria comando com confirmação pendente', async () => {
    const response = await commandsPost(jsonRequest('/api/commands', {
      method: 'POST',
      token,
      body: { vehicle_id: vehicleId, type: 'block_vehicle', confirmation_required: true },
    }));
    expect(response.status).toBe(200);
    const body = await response.json() as {
      success: boolean;
      data: { command_id: string; status: string; confirmation_token: string };
    };
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('pending_confirmation');
    expect(body.data.confirmation_token).toBeTruthy();
    commandId = body.data.command_id;
    confirmationToken = body.data.confirmation_token;
  });

  it('rejeita token de confirmação inválido', async () => {
    const response = await confirmPost(jsonRequest('/api/commands/confirm', {
      method: 'POST',
      token,
      body: { command_id: commandId, confirmation_token: 'token-invalido' },
    }));
    expect(response.status).toBe(400);
    const body = await response.json() as { code: string };
    expect(body.code).toBe('INVALID_TOKEN');
  });

  it('confirma comando com token válido e persiste sent_to_device', async () => {
    const response = await confirmPost(jsonRequest('/api/commands/confirm', {
      method: 'POST',
      token,
      body: { command_id: commandId, confirmation_token: confirmationToken },
    }));
    expect(response.status).toBe(200);

    const pool = getDbPool();
    const row = await pool.query('SELECT status FROM commands WHERE id = $1', [commandId]);
    expect(row.rows[0].status).toBe('sent_to_device');
  });

  it('não permite confirmar duas vezes', async () => {
    const response = await confirmPost(jsonRequest('/api/commands/confirm', {
      method: 'POST',
      token,
      body: { command_id: commandId, confirmation_token: confirmationToken },
    }));
    expect(response.status).toBe(400);
  });

  it('lista comandos com total real de paginação', async () => {
    const response = await commandsGet(jsonRequest(`/api/commands?vehicle_id=${vehicleId}`, { token }));
    expect(response.status).toBe(200);
    const body = await response.json() as { data: unknown[]; pagination: { total: number } };
    expect(body.pagination.total).toBeGreaterThanOrEqual(1);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
  });
});

describe('alerts', () => {
  let alertId = 0;

  it('lista alertas do usuário (escopo via veículo)', async () => {
    const pool = getDbPool();
    const inserted = await pool.query(
      `INSERT INTO alerts (vehicle_id, type, severity, title, message)
       VALUES ($1, 'speed', 'warning', 'Velocidade excedida', 'Teste de integração')
       RETURNING id`,
      [vehicleId]
    );
    alertId = inserted.rows[0].id;

    const response = await alertsGet(jsonRequest('/api/alerts', { token }));
    expect(response.status).toBe(200);
    const body = await response.json() as { data?: Array<{ id: number }>; alerts?: Array<{ id: number }> };
    const list = body.data ?? body.alerts ?? [];
    expect(list.some(alert => alert.id === alertId)).toBe(true);
  });

  it('marca alerta como lido (persistido)', async () => {
    const response = await alertsPatch(jsonRequest('/api/alerts', {
      method: 'PATCH',
      token,
      body: { ids: [alertId] },
    }));
    expect(response.status).toBe(200);

    const pool = getDbPool();
    const row = await pool.query('SELECT is_read FROM alerts WHERE id = $1', [alertId]);
    expect(row.rows[0].is_read).toBe(true);
  });
});

describe('users (gate de RBAC)', () => {
  it('rejeita sem token (401)', async () => {
    const response = await usersGet(jsonRequest('/api/users'));
    expect(response.status).toBe(401);
  });

  it('rejeita usuário sem papel Administrador (403 fail-closed)', async () => {
    const response = await usersGet(jsonRequest('/api/users', { token }));
    expect(response.status).toBe(403);
  });

  it('permite administrador com papel persistido (200)', async () => {
    // Criar admin e atribuir papel via RBAC real
    const registerResponse = await registerHandler(jsonRequest('/api/auth/register', {
      method: 'POST',
      body: { email: ADMIN_EMAIL, password: PASSWORD, name: 'Admin Integração' },
    }));
    const registerBody = await registerResponse.json() as { token: string; user: { id: string } };
    adminToken = registerBody.token;
    adminUserId = registerBody.user.id;

    const pool = getDbPool();
    await pool.query(
      `INSERT INTO profiles (id, name, role_id)
       VALUES ($1, 'Admin Integração', (SELECT id FROM roles WHERE name = 'Administrador'))
       ON CONFLICT (id) DO UPDATE SET role_id = EXCLUDED.role_id`,
      [adminUserId]
    );

    const response = await usersGet(jsonRequest('/api/users', { token: adminToken }));
    expect(response.status).toBe(200);
    const body = await response.json() as { data: Array<{ id: string }>; total: number };
    expect(body.total).toBeGreaterThanOrEqual(2);
    expect(body.data.some(user => user.id === userId)).toBe(true);
  });
});

describe('notifications', () => {
  it('lista apenas notificações reais e persiste marcação de leitura', async () => {
    const pool = getDbPool();
    const inserted = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message)
       VALUES ($1, 'alert', 'Notificação de teste', 'Integração') RETURNING id`,
      [userId]
    );
    const notificationId = inserted.rows[0].id;

    const listResponse = await notificationsGet(jsonRequest('/api/notifications?read=unread', { token }));
    expect(listResponse.status).toBe(200);
    const list = await listResponse.json() as Array<{ id: string }>;
    expect(list.some(item => item.id === String(notificationId))).toBe(true);

    const patchResponse = await notificationsPatch(jsonRequest('/api/notifications', {
      method: 'PATCH',
      token,
      body: { id: notificationId, read: true },
    }));
    expect(patchResponse.status).toBe(200);

    const row = await pool.query('SELECT read FROM notifications WHERE id = $1', [notificationId]);
    expect(row.rows[0].read).toBe(true);
  });
});

describe('settings', () => {
  it('persiste preferências entre leituras (round-trip)', async () => {
    const putResponse = await settingsPut(jsonRequest('/api/settings', {
      method: 'PUT',
      token,
      body: { language: 'pt-BR', dark_mode: true },
    }));
    expect(putResponse.status).toBe(200);

    const getResponse = await settingsGet(jsonRequest('/api/settings', { token }));
    expect(getResponse.status).toBe(200);
    const body = await getResponse.json() as { preferences: { language?: string; dark_mode?: boolean } };
    expect(body.preferences.language).toBe('pt-BR');
    expect(body.preferences.dark_mode).toBe(true);
  });
});

describe('reports', () => {
  it('gera relatório com dados reais e lista com paginação', async () => {
    const pool = getDbPool();
    // Semear uma viagem real para o período
    await pool.query(
      `INSERT INTO trips (vehicle_id, start_time, end_time, distance, fuel_consumed, max_speed, status)
       VALUES ($1, NOW() - interval '1 hour', NOW(), 42.5, 5.2, 88, 'completed')`,
      [vehicleId]
    );

    const createResponse = await reportsPost(jsonRequest('/api/reports', {
      method: 'POST',
      token,
      body: {
        reportType: 'mileage',
        startDate: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        vehicleIds: [vehicleId],
      },
    }));
    expect(createResponse.status).toBe(201);
    const created = await createResponse.json() as { report: { id: string; status: string } };
    expect(created.report.status).toBe('completed');

    const listResponse = await reportsGet(jsonRequest('/api/reports?limit=10&offset=0', { token }));
    expect(listResponse.status).toBe(200);
    const listBody = await listResponse.json() as {
      reports: Array<{ id: string }>;
      pagination: { total: number };
    };
    expect(listBody.pagination.total).toBeGreaterThanOrEqual(1);
    expect(listBody.reports.some(report => report.id === created.report.id)).toBe(true);

    // Conteúdo reflete a viagem semeada (dados reais, não fabricados)
    const contentRow = await pool.query('SELECT content FROM reports WHERE id = $1', [created.report.id]);
    expect(Number(contentRow.rows[0].content.totals.distance_km)).toBeCloseTo(42.5, 1);
  });
});
