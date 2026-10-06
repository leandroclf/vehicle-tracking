import { checkEntitlement } from '../entitlements';

describe('checkEntitlement', () => {
  test('allows usage below a configured limit', () => {
    expect(checkEntitlement({ plan: 'free', capability: 'geofences', usage: 2, limits: { geofences: 3 } })).toMatchObject({
      allowed: true, remaining: 1, reason: 'allowed'
    });
  });

  test('denies usage at the configured limit', () => {
    expect(checkEntitlement({ plan: 'free', capability: 'geofences', usage: 3, limits: { geofences: 3 } })).toMatchObject({
      allowed: false, remaining: 0, reason: 'limit_reached'
    });
  });

  test('treats missing limit as unlimited', () => {
    expect(checkEntitlement({ plan: 'paid', capability: 'geofences', usage: 99, limits: {} })).toMatchObject({
      allowed: true, limit: null, reason: 'unlimited'
    });
  });
});
