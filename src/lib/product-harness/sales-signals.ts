import type { SalesSignal } from '@leandroclf/product-platform-harness';
export type { SalesSignal } from '@leandroclf/product-platform-harness';
export { toSalesSignal } from '@leandroclf/product-platform-harness';

export interface SalesSignalSink {
  emit(signal: SalesSignal): Promise<void>;
}
