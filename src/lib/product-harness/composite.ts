import type { ProductEvent, ProductEventSink } from './events';

export class CompositeProductEventSink implements ProductEventSink {
  constructor(private readonly sinks: ProductEventSink[]) {}

  async emit(event: ProductEvent): Promise<void> {
    const results = await Promise.allSettled(this.sinks.map((sink) => sink.emit(event)));
    const failures = results.filter((result) => result.status === 'rejected');
    if (failures.length === this.sinks.length && failures.length > 0) {
      throw new Error('All product event sinks failed');
    }
  }
}
