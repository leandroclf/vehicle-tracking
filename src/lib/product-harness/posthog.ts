import type { ProductEvent, ProductEventSink } from './events';

export interface PostHogSinkOptions {
  token: string;
  host?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export class PostHogProductEventSink implements ProductEventSink {
  private readonly host: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: PostHogSinkOptions) {
    this.host = (options.host || 'https://us.i.posthog.com').replace(/\/$/, '');
    this.timeoutMs = options.timeoutMs ?? 1500;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async emit(event: ProductEvent): Promise<void> {
    const distinctId = event.user_id || event.account_id;
    if (!distinctId) return;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(`${this.host}/i/v0/e/`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          api_key: this.options.token,
          event: event.event,
          distinct_id: distinctId,
          properties: {
            product_id: event.product_id,
            environment: event.environment,
            release_sha: event.release_sha,
            account_id: event.account_id,
            plan_id: event.plan_id,
            session_id: event.session_id,
            feature: event.feature,
            outcome: event.outcome,
          },
          timestamp: event.occurred_at,
        }),
      });
      if (!response.ok) throw new Error(`PostHog capture failed with status ${response.status}`);
    } finally {
      clearTimeout(timer);
    }
  }
}

export function createPostHogSinkFromEnv(): PostHogProductEventSink | null {
  const token = process.env.POSTHOG_PROJECT_TOKEN;
  if (!token) return null;
  return new PostHogProductEventSink({
    token,
    host: process.env.POSTHOG_HOST,
    timeoutMs: Number(process.env.POSTHOG_TIMEOUT_MS || 1500),
  });
}
