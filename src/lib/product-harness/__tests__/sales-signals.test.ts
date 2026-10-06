import { createProductEvent } from '../events';
import { toSalesSignal } from '../sales-signals';

describe('toSalesSignal', () => {
  test('converts a commercial-intent event with a stable daily dedupe key', () => {
    const event = createProductEvent('limit_reached', { account_id: 'acct-1', user_id: 'user-1', feature: 'geofences', plan_id: 'free' });
    event.occurred_at = '2026-10-06T10:00:00.000Z';
    expect(toSalesSignal(event)).toMatchObject({
      idempotencyKey: 'vehicle-tracking:acct-1:limit_reached:geofences:2026-10-06',
      kind: 'usage_limit_reached',
      accountId: 'acct-1',
      feature: 'geofences',
    });
  });

  test('ignores non-commercial product events', () => {
    expect(toSalesSignal(createProductEvent('feature_used', { account_id: 'acct-1' }))).toBeNull();
  });

  test('requires an account identity', () => {
    expect(toSalesSignal(createProductEvent('limit_reached', { user_id: 'user-1' }))).toBeNull();
  });
});
