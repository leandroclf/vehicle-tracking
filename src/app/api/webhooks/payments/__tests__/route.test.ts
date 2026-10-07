import { setProductEventSink } from '@/lib/product-harness/events';
import { PaymentFactory } from '@/lib/payments/factory';
import { processPaymentEventOnce } from '@/lib/payments/event-store';
import { POST } from '../route';

jest.mock('@/lib/product-harness/configure', () => ({ configureProductHarness: jest.fn() }));
jest.mock('@/lib/payments/factory', () => ({ PaymentFactory: { fromWebhook: jest.fn() } }));
jest.mock('@/lib/payments/event-store', () => ({ processPaymentEventOnce: jest.fn() }));

function useGateway(event: Record<string, unknown>) {
  (PaymentFactory.fromWebhook as jest.Mock).mockReturnValue({
    verifyWebhook: async () => true,
    normalizeWebhook: async () => event,
  });
}

const request = () => new Request('https://app.test/api/webhooks/payments', { method: 'POST', body: '{}' });

describe('payment webhook product events', () => {
  const emit = jest.fn();
  const logged = jest.spyOn(console, 'error').mockImplementation(() => undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    emit.mockResolvedValue(undefined);
    setProductEventSink({ emit });
    (processPaymentEventOnce as jest.Mock).mockResolvedValue('processed');
  });

  afterAll(() => logged.mockRestore());

  it('emits subscription_changed without sending plan_id as undefined', async () => {
    useGateway({ type: 'subscription', tenantId: 'tenant-1', status: 'active' });
    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(emit).toHaveBeenCalledTimes(1);
    const event = emit.mock.calls[0][0];
    expect(event).toMatchObject({ event: 'subscription_changed', account_id: 'tenant-1', feature: 'subscription', outcome: 'active' });
    expect('plan_id' in event).toBe(false);
  });

  it('does not fail the webhook when the analytics event cannot be created', async () => {
    useGateway({ type: 'subscription', tenantId: 'tenant-1', status: 123 });
    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true, result: 'processed' });
    expect(emit).not.toHaveBeenCalled();
  });

  it('emits nothing for duplicates, payments or events without a tenant', async () => {
    (processPaymentEventOnce as jest.Mock).mockResolvedValueOnce('duplicate');
    useGateway({ type: 'subscription', tenantId: 'tenant-1', status: 'active' });
    await POST(request());
    useGateway({ type: 'payment', tenantId: 'tenant-1', status: 'paid' });
    await POST(request());
    useGateway({ type: 'subscription', status: 'active' });
    await POST(request());

    expect(emit).not.toHaveBeenCalled();
  });
});
