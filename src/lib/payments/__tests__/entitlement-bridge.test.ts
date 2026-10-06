import { checkEntitlement } from '@/lib/product-harness/entitlements';

describe('payment-backed entitlement policy',()=>{
  test('paid plan can receive an unlimited capability without gateway knowledge',()=>{
    const decision=checkEntitlement({plan:'pro',capability:'geofences',usage:500,limits:{geofences:null}});
    expect(decision.allowed).toBe(true);
    expect(decision.reason).toBe('unlimited');
  });
  test('free plan remains bounded independently of payment provider',()=>{
    const decision=checkEntitlement({plan:'free',capability:'geofences',usage:3,limits:{geofences:3}});
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('limit_reached');
  });
});
