import { HubSpotSalesSignalSink } from './hubspot';
import { resolveCommercialIdentity } from './commercial-identity';
import { SalesOutboxWorker } from './sales-outbox-worker';

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export function createSalesOutboxWorkerFromEnv(): SalesOutboxWorker | null {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!accessToken) return null;

  const sink = new HubSpotSalesSignalSink({
    accessToken,
    resolveIdentity: resolveCommercialIdentity,
    timeoutMs: positiveInt(process.env.HUBSPOT_TIMEOUT_MS, 2000),
  });
  return new SalesOutboxWorker({
    sink,
    batchSize: positiveInt(process.env.SALES_OUTBOX_BATCH_SIZE, 20),
    maxAttempts: positiveInt(process.env.SALES_OUTBOX_MAX_ATTEMPTS, 5),
  });
}
