import { HubSpotSalesSignalSink } from './hubspot';
import { resolveCommercialIdentity } from './commercial-identity';
import { SalesOutboxWorker } from './sales-outbox-worker';

export function createSalesOutboxWorkerFromEnv(): SalesOutboxWorker | null {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!accessToken) return null;

  const sink = new HubSpotSalesSignalSink({
    accessToken,
    resolveIdentity: resolveCommercialIdentity,
    timeoutMs: Number(process.env.HUBSPOT_TIMEOUT_MS || 2000),
  });
  return new SalesOutboxWorker({
    sink,
    batchSize: Number(process.env.SALES_OUTBOX_BATCH_SIZE || 20),
    maxAttempts: Number(process.env.SALES_OUTBOX_MAX_ATTEMPTS || 5),
  });
}
