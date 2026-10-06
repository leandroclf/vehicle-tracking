import type { SalesSignal, SalesSignalSink } from './sales-signals';

export interface CommercialIdentity {
  email: string;
  name?: string | null;
  phone?: string | null;
}

export type CommercialIdentityResolver = (accountId: string) => Promise<CommercialIdentity | null>;

export interface HubSpotSalesSignalOptions {
  accessToken: string;
  resolveIdentity: CommercialIdentityResolver;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export class HubSpotSalesSignalSink implements SalesSignalSink {
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(private readonly options: HubSpotSalesSignalOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 2000;
  }

  async emit(signal: SalesSignal): Promise<void> {
    const identity = await this.options.resolveIdentity(signal.accountId);
    if (!identity?.email) return;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl('https://api.hubapi.com/crm/v3/objects/contacts/batch/upsert', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${this.options.accessToken}`,
          'content-type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          inputs: [{
            idProperty: 'email',
            id: identity.email,
            properties: {
              email: identity.email,
              firstname: identity.name || '',
              phone: identity.phone || '',
              product_signal: signal.kind,
              product_feature: signal.feature || '',
              product_plan: signal.planId || '',
              product_signal_at: signal.occurredAt,
              product_signal_key: signal.idempotencyKey,
            },
          }],
        }),
      });
      if (!response.ok) throw new Error(`HubSpot upsert failed with status ${response.status}`);
    } finally {
      clearTimeout(timer);
    }
  }
}
