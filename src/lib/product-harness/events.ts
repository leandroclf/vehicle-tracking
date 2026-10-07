import { createProductEvent as createSharedEvent } from '@leandroclf/product-platform-harness';
import type { ProductEvent as SharedProductEvent, ProductEventName } from '@leandroclf/product-platform-harness';

export type { ProductEventName } from '@leandroclf/product-platform-harness';
export type ProductEvent = Omit<SharedProductEvent, 'product_id'> & { product_id: 'vehicle-tracking' };

export interface ProductEventSink {
  emit(event: ProductEvent): Promise<void>;
}

let sink: ProductEventSink = { async emit(event) { console.info('product_event', event); } };

export function setProductEventSink(next: ProductEventSink): void { sink = next; }

type ProductEventFields = Partial<Omit<ProductEvent, 'event' | 'product_id' | 'environment' | 'release_sha' | 'occurred_at'>>;

export function createProductEvent(event: ProductEventName, fields: ProductEventFields = {}): ProductEvent {
  return {
    ...createSharedEvent({
      productId: 'vehicle-tracking',
      environment: process.env.NODE_ENV || 'development',
      releaseSha: process.env.RELEASE_SHA || 'local',
    }, event, fields),
    product_id: 'vehicle-tracking',
  };
}

export async function emitProductEvent(event: ProductEvent): Promise<void> {
  try { await sink.emit(event); } catch (error) { console.error('product_event_delivery_failed', error); }
}
