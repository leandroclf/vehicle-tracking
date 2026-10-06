import { getDbPool } from '@/lib/database';

export interface BillingEntitlement {
  tenantId: string | null;
  plan: string;
  access: 'active' | 'blocked';
  source: 'subscription' | 'free';
}

export async function resolveBillingEntitlement(userId: string): Promise<BillingEntitlement> {
  const result = await getDbPool().query(
    `SELECT s.tenant_id, s.plan_id, s.access_status
       FROM payment_tenant_users tu
       JOIN payment_subscriptions s ON s.tenant_id = tu.tenant_id
      WHERE tu.user_id = $1
      ORDER BY
        CASE WHEN s.access_status = 'active' THEN 0 ELSE 1 END,
        s.updated_at DESC
      LIMIT 1`,
    [userId],
  );

  const row = result.rows[0];
  if (!row) {
    return { tenantId: null, plan: 'free', access: 'active', source: 'free' };
  }

  return {
    tenantId: String(row.tenant_id),
    plan: String(row.plan_id),
    access: row.access_status === 'active' ? 'active' : 'blocked',
    source: 'subscription',
  };
}
