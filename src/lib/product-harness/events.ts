export type ProductEventName = 'signup_completed' | 'activation_completed' | 'feature_used' | 'limit_reached' | 'upgrade_intent' | 'subscription_changed' | 'feedback_submitted';

export interface ProductEvent {
  schema_version: '1.0';
  event: ProductEventName;
  product_id: 'vehicle-tracking';
  environment: string;
  release_sha: string;
  occurred_at: string;
  user_id?: string | null;
  account_id?: string | null;
  plan_id?: string | null;
  session_id?: string | null;
  feature?: string | null;
  outcome?: string | null;
}

export interface ProductEventSink {
  emit(event: ProductEvent): Promise<void>;
}

let sink: ProductEventSink = { async emit(event) { console.info('product_event', event); } };

export function setProductEventSink(next: ProductEventSink): void { sink = next; }

type ProductEventFields = Partial<Omit<ProductEvent, 'event' | 'product_id' | 'environment' | 'release_sha' | 'occurred_at'>>;

export function createProductEvent(event: ProductEventName, fields: ProductEventFields = {}): ProductEvent {
  return {
    ...fields,
    schema_version: '1.0',
    event,
    product_id: 'vehicle-tracking',
    environment: process.env.NODE_ENV || 'development',
    release_sha: process.env.RELEASE_SHA || 'local',
    occurred_at: new Date().toISOString(),
  };
}

export async function emitProductEvent(event: ProductEvent): Promise<void> {
  try { await sink.emit(event); } catch (error) { console.error('product_event_delivery_failed', error); }
}
