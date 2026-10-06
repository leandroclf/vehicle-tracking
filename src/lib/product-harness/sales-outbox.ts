import { sql } from 'drizzle-orm';
import { db } from '@/lib/database';
import type { SalesSignal } from './sales-signals';

export async function enqueueSalesSignal(signal: SalesSignal): Promise<void> {
  await db.execute(sql`
    INSERT INTO sales_signal_outbox
      (idempotency_key, kind, account_id, user_id, plan_id, feature, occurred_at)
    VALUES
      (${signal.idempotencyKey}, ${signal.kind}, ${signal.accountId}::uuid,
       ${signal.userId || null}::uuid, ${signal.planId || null},
       ${signal.feature || null}, ${signal.occurredAt}::timestamp)
    ON CONFLICT (idempotency_key) DO NOTHING
  `);
}
