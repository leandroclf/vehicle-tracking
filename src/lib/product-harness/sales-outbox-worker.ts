import { getDbPool } from '@/lib/database';
import type { SalesSignal, SalesSignalSink } from './sales-signals';

interface OutboxRow {
  id: number;
  idempotency_key: string;
  kind: SalesSignal['kind'];
  account_id: string;
  user_id: string | null;
  plan_id: string | null;
  feature: string | null;
  occurred_at: Date;
}

export interface SalesOutboxWorkerOptions {
  sink: SalesSignalSink;
  batchSize?: number;
  maxAttempts?: number;
}

export class SalesOutboxWorker {
  private readonly batchSize: number;
  private readonly maxAttempts: number;

  constructor(private readonly options: SalesOutboxWorkerOptions) {
    this.batchSize = options.batchSize ?? 20;
    this.maxAttempts = options.maxAttempts ?? 5;
  }

  async runOnce(): Promise<number> {
    const client = await getDbPool().connect();
    let rows: OutboxRow[] = [];
    try {
      await client.query('BEGIN');
      const result = await client.query<OutboxRow>(
        `SELECT id, idempotency_key, kind, account_id, user_id, plan_id, feature, occurred_at
           FROM sales_signal_outbox
          WHERE status IN ('pending', 'retry')
            AND attempts < $1
          ORDER BY id
          FOR UPDATE SKIP LOCKED
          LIMIT $2`,
        [this.maxAttempts, this.batchSize],
      );
      rows = result.rows;
      if (rows.length) {
        await client.query(
          `UPDATE sales_signal_outbox
              SET status = 'processing', attempts = attempts + 1
            WHERE id = ANY($1::int[])`,
          [rows.map((row) => row.id)],
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    for (const row of rows) {
      const signal: SalesSignal = {
        idempotencyKey: row.idempotency_key,
        kind: row.kind,
        accountId: row.account_id,
        userId: row.user_id,
        planId: row.plan_id,
        feature: row.feature,
        occurredAt: row.occurred_at.toISOString(),
      };
      try {
        await this.options.sink.emit(signal);
        await getDbPool().query(
          `UPDATE sales_signal_outbox
              SET status = 'delivered', delivered_at = now(), last_error = NULL
            WHERE id = $1 AND status = 'processing'`,
          [row.id],
        );
      } catch (error) {
        const message = error instanceof Error ? error.message.slice(0, 1000) : 'unknown delivery error';
        await getDbPool().query(
          `UPDATE sales_signal_outbox
              SET status = CASE WHEN attempts >= $2 THEN 'failed' ELSE 'retry' END,
                  last_error = $3
            WHERE id = $1 AND status = 'processing'`,
          [row.id, this.maxAttempts, message],
        );
      }
    }
    return rows.length;
  }
}
