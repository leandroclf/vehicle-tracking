import { CompositeProductEventSink } from './composite';
import { setProductEventSink, type ProductEventSink } from './events';
import { createPostHogSinkFromEnv } from './posthog';

class StructuredLogSink implements ProductEventSink {
  async emit(event: Parameters<ProductEventSink['emit']>[0]): Promise<void> {
    console.info('product_event', event);
  }
}

let configured = false;

export function configureProductHarness(): void {
  if (configured) return;
  configured = true;

  const sinks: ProductEventSink[] = [new StructuredLogSink()];
  const posthog = createPostHogSinkFromEnv();
  if (posthog) sinks.push(posthog);

  setProductEventSink(new CompositeProductEventSink(sinks));
}
