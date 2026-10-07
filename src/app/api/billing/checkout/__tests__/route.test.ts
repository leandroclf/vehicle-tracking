import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { PaymentFactory } from '@/lib/payments/factory';
import { resolveBillingPrice } from '@/lib/payments/catalog';
import { getDbPool } from '@/lib/database';
import { POST } from '../route';

jest.mock('@/lib/auth-middleware', () => ({ verifyAuth: jest.fn() }));
jest.mock('@/lib/payments/factory', () => ({ PaymentFactory: { create: jest.fn() } }));
jest.mock('@/lib/payments/catalog', () => ({ resolveBillingPrice: jest.fn() }));
jest.mock('@/lib/database', () => ({ getDbPool: jest.fn() }));

type Row = Record<string, unknown>;

describe('billing checkout', () => {
  const gateway = {
    name: 'stripe',
    createCustomer: jest.fn(),
    createSubscription: jest.fn(),
    cancelSubscription: jest.fn(),
  };
  const calls: { sql: string; params: unknown[] }[] = [];
  const release = jest.fn();
  let existing: Row[] = [];
  let insertFails = false;
  const logged = jest.spyOn(console, 'error').mockImplementation(() => undefined);

  const query = async (sql: string, params: unknown[] = []) => {
    calls.push({ sql, params });
    if (sql.includes('FROM payment_tenant_users')) return { rows: [{ tenant_id: 'tenant-1' }] };
    if (sql.includes('FROM users')) return { rows: [{ email: 'a@b.test', name: 'Ana' }] };
    if (sql.includes('FROM payment_subscriptions')) return { rows: existing };
    if (sql.includes('INSERT INTO payment_subscriptions')) {
      if (insertFails) throw new Error('db down');
      return { rows: [] };
    }
    return { rows: [] };
  };
  const sqlOf = (needle: string) => calls.filter((c) => c.sql.includes(needle));

  const request = (body: unknown = { plan: 'pro', currency: 'USD' }) =>
    new NextRequest('https://app.test/api/billing/checkout', {
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });

  beforeEach(() => {
    jest.clearAllMocks();
    calls.length = 0;
    existing = [];
    insertFails = false;
    (verifyAuth as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } });
    (PaymentFactory.create as jest.Mock).mockReturnValue(gateway);
    (resolveBillingPrice as jest.Mock).mockResolvedValue({ externalPriceId: 'price_1', amountMinor: 4900 });
    gateway.createCustomer.mockResolvedValue({ id: 'cus_1' });
    gateway.createSubscription.mockResolvedValue({ id: 'sub_1', status: 'pending', checkoutUrl: 'https://pay.test/1' });
    gateway.cancelSubscription.mockResolvedValue(undefined);
    (getDbPool as jest.Mock).mockReturnValue({ query, connect: async () => ({ query, release }) });
  });

  afterAll(() => logged.mockRestore());

  it('creates one customer and one subscription and stores it blocked until the webhook confirms', async () => {
    const response = await POST(request());

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ gateway: 'stripe', subscriptionId: 'sub_1', checkoutUrl: 'https://pay.test/1' });
    expect(gateway.createCustomer).toHaveBeenCalledTimes(1);
    expect(gateway.createSubscription).toHaveBeenCalledTimes(1);
    expect(sqlOf('INSERT INTO payment_subscriptions')).toHaveLength(1);
    expect(sqlOf('INSERT INTO payment_subscriptions')[0].sql).toContain("'blocked'");
  });

  it('serializes checkouts of the same tenant and plan with an advisory lock that is always released', async () => {
    await POST(request());

    const lock = sqlOf('pg_advisory_lock')[0];
    expect(lock.params[0]).toBe('billing:tenant-1:pro:stripe');
    expect(sqlOf('pg_advisory_unlock')[0].params[0]).toBe('billing:tenant-1:pro:stripe');
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('refuses a second checkout when the tenant already has a live subscription for the plan', async () => {
    existing = [{ external_subscription_id: 'sub_old', status: 'active', created_at: new Date() }];
    const response = await POST(request());

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: 'billing_subscription_exists', subscriptionId: 'sub_old' });
    expect(gateway.createCustomer).not.toHaveBeenCalled();
    expect(gateway.createSubscription).not.toHaveBeenCalled();
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('refuses a duplicate click while a recent pending checkout exists, but allows retrying an old abandoned one', async () => {
    existing = [{ external_subscription_id: 'sub_pending', status: 'pending', created_at: new Date() }];
    expect((await POST(request())).status).toBe(409);
    expect(gateway.createSubscription).not.toHaveBeenCalled();

    existing = [{ external_subscription_id: 'sub_stale', status: 'pending', created_at: new Date(Date.now() - 3 * 60 * 60 * 1000) }];
    expect((await POST(request())).status).toBe(201);
    expect(gateway.createSubscription).toHaveBeenCalledTimes(1);
  });

  it('cancels the provider subscription when it cannot be stored, instead of leaving it orphaned', async () => {
    insertFails = true;
    const response = await POST(request());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'billing_persistence_failed' });
    expect(gateway.cancelSubscription).toHaveBeenCalledWith('sub_1');
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('maps client and configuration problems to 4xx/5xx codes instead of a generic 500', async () => {
    expect((await POST(request('{not json'))).status).toBe(400);

    (resolveBillingPrice as jest.Mock).mockRejectedValueOnce(new Error('billing_price_not_configured'));
    const noPrice = await POST(request());
    expect(noPrice.status).toBe(409);
    expect(await noPrice.json()).toEqual({ error: 'billing_price_not_configured' });

    (PaymentFactory.create as jest.Mock).mockImplementationOnce(() => { throw new Error('Stripe is not configured'); });
    expect((await POST(request())).status).toBe(503);

    gateway.createSubscription.mockRejectedValueOnce(new Error('provider timeout'));
    const providerDown = await POST(request());
    expect(providerDown.status).toBe(502);
    expect(sqlOf('INSERT INTO payment_subscriptions')).toHaveLength(0);
    expect(gateway.createCustomer).toHaveBeenCalled();
  });

  it('picks the tenant deterministically, owner first', async () => {
    await POST(request());
    expect(sqlOf('FROM payment_tenant_users')[0].sql).toMatch(/ORDER BY[\s\S]*role[\s\S]*tenant_id/);
  });
});
