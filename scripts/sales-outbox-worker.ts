import { createSalesOutboxWorkerFromEnv } from '../src/lib/product-harness/sales-worker-config';
import { closePool } from '../src/lib/database';

async function main() {
  const worker = createSalesOutboxWorkerFromEnv();
  if (!worker) {
    console.error('HUBSPOT_ACCESS_TOKEN is required to run the sales outbox worker');
    process.exitCode = 1;
    return;
  }

  const intervalMs = Number(process.env.SALES_OUTBOX_POLL_MS || 5000);
  const staleMinutes = Number(process.env.SALES_OUTBOX_STALE_MINUTES || 10);
  let stopping = false;

  const stop = () => { stopping = true; };
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);

  await worker.recoverStaleProcessing(staleMinutes);
  while (!stopping) {
    const processed = await worker.runOnce();
    if (processed === 0) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }
  await closePool();
}

main().catch(async (error) => {
  console.error('sales_outbox_worker_failed', error);
  await closePool();
  process.exit(1);
});
