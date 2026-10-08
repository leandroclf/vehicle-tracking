import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

let sdk: NodeSDK | null = null;

export function startTelemetry(): NodeSDK | null {
  if (process.env.OTEL_ENABLED !== 'true') return null;
  sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: 'vehicle-tracking',
      [ATTR_SERVICE_VERSION]: process.env.RELEASE_SHA || 'local',
      'deployment.environment.name': process.env.NODE_ENV || 'development',
    }),
    traceExporter: new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
    }),
    instrumentations: [getNodeAutoInstrumentations()],
  });
  sdk.start();
  return sdk;
}

export async function stopTelemetry(): Promise<void> {
  if (sdk) await sdk.shutdown();
}
