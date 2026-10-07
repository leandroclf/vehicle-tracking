import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { enqueueSalesSignal } from '@/lib/product-harness/sales-outbox';
import { setProductEventSink } from '@/lib/product-harness/events';
import { db } from '@/lib/database';
import { POST } from '../route';

jest.mock('@/lib/auth-middleware', () => ({ verifyAuth: jest.fn() }));
jest.mock('@/lib/product-harness/configure', () => ({ configureProductHarness: jest.fn() }));
jest.mock('@/lib/product-harness/sales-outbox', () => ({ enqueueSalesSignal: jest.fn() }));
jest.mock('@/lib/schema', () => ({ geofences: { userId: 'userId' } }));
jest.mock('drizzle-orm', () => ({
  eq: (field: string, value: string) => ({ field, value }),
  count: () => 'count', and: (...items: unknown[]) => items,
  asc: jest.fn(), desc: jest.fn(),
}));
jest.mock('@/lib/database', () => ({ db: { select: jest.fn(), insert: jest.fn() } }));

describe('geofence entitlement integration', () => {
  const originalLimit = process.env.FREE_GEOFENCE_LIMIT;
  const usage: Record<string, number> = { 'account-a': 3, 'account-b': 0 };
  const filters: unknown[] = [];
  const emit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    filters.length = 0;
    process.env.FREE_GEOFENCE_LIMIT = '3';
    (verifyAuth as jest.Mock).mockResolvedValue({ user: { id: 'account-a' } });
    (enqueueSalesSignal as jest.Mock).mockResolvedValue(undefined);
    emit.mockResolvedValue(undefined);
    setProductEventSink({ emit });
    (db.select as jest.Mock).mockReturnValue({ from: () => ({ where: (filter: { field: string; value: string }) => {
      filters.push(filter);
      return Promise.resolve([{ value: usage[filter.value] }]);
    } }) });
    (db.insert as jest.Mock).mockReturnValue({ values: (row: object) => ({ returning: async () => [{ id: 1, ...row }] }) });
  });

  afterAll(() => {
    if (originalLimit === undefined) delete process.env.FREE_GEOFENCE_LIMIT;
    else process.env.FREE_GEOFENCE_LIMIT = originalLimit;
    setProductEventSink({ async emit() {} });
  });

  function request() {
    return new NextRequest('http://localhost/api/geofences', { method: 'POST', body: JSON.stringify({ name: 'Test fence', type: 'circle', coordinates: '{"lat":10,"lng":20}', radius: 100 }) });
  }

  test('denies at the limit and emits a privacy-safe signal for the authenticated account', async () => {
    const response = await POST(request());
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ code: 'ENTITLEMENT_LIMIT_REACHED', entitlement: { allowed: false, usage: 3, limit: 3 } });
    expect(db.insert).not.toHaveBeenCalled();
    expect(emit).toHaveBeenCalledWith(expect.objectContaining({ account_id: 'account-a', event: 'limit_reached' }));
    expect(emit.mock.calls[0][0]).not.toHaveProperty('coordinates');
    expect(enqueueSalesSignal).toHaveBeenCalledWith(expect.objectContaining({ accountId: 'account-a', feature: 'geofences' }));
  });

  test('counts only the authenticated account and permits another account below its limit', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({ user: { id: 'account-b' } });
    const response = await POST(request());
    expect(response.status).toBe(201);
    expect(filters).toEqual([{ field: 'userId', value: 'account-b' }]);
    expect(emit).not.toHaveBeenCalled();
    expect(enqueueSalesSignal).not.toHaveBeenCalled();
  });

  test('preserves the denial response when analytics and sales delivery fail', async () => {
    emit.mockRejectedValue(new Error('analytics offline'));
    (enqueueSalesSignal as jest.Mock).mockRejectedValue(new Error('outbox unavailable'));
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const response = await POST(request());
      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({ code: 'ENTITLEMENT_LIMIT_REACHED' });
      expect(db.insert).not.toHaveBeenCalled();
      expect(log).toHaveBeenCalled();
    } finally {
      log.mockRestore();
    }
  });
});
