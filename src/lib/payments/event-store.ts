import { getDbPool } from '@/lib/database';
import type { NormalizedPaymentEvent } from './types';

export async function processPaymentEventOnce(event:NormalizedPaymentEvent):Promise<'processed'|'duplicate'>{
  const client=await getDbPool().connect();
  try{
    await client.query('BEGIN');
    const inserted=await client.query(`INSERT INTO payment_webhook_events
      (idempotency_key,gateway,external_event_id,external_resource_id,event_type,action,normalized_status)
      VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (idempotency_key) DO NOTHING RETURNING id`,
      [event.idempotencyKey,event.gateway,event.externalEventId,event.externalResourceId,event.type,event.action,event.status]);
    if(inserted.rowCount===0){await client.query('ROLLBACK');return 'duplicate';}
    if(event.type==='subscription'){
      await client.query(`UPDATE payment_subscriptions SET status=$1, access_status=CASE WHEN $1='active' THEN 'active' ELSE 'blocked' END, updated_at=now()
        WHERE gateway=$2 AND external_subscription_id=$3`,[event.status,event.gateway,event.externalResourceId]);
    } else if(event.tenantId&&event.amountMinor!==undefined&&event.currency){
      await client.query(`INSERT INTO payment_transactions
        (tenant_id,gateway,external_transaction_id,amount_minor,currency,status,occurred_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (gateway,external_transaction_id) DO NOTHING`,
        [event.tenantId,event.gateway,event.externalResourceId,event.amountMinor,event.currency,event.status,event.occurredAt]);
    }
    await client.query('COMMIT'); return 'processed';
  }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
}
