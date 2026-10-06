import { PostHogProductEventSink } from '../posthog';
import { createProductEvent } from '../events';

describe('PostHogProductEventSink', () => {
  test('maps the canonical event without credentials or domain-sensitive data', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    const sink = new PostHogProductEventSink({ token: 'test-token', fetchImpl: fetchImpl as unknown as typeof fetch });
    await sink.emit(createProductEvent('limit_reached', { user_id: 'opaque-user', account_id: 'opaque-account', feature: 'geofences' }));

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body as string);
    expect(body.distinct_id).toBe('opaque-user');
    expect(body.event).toBe('limit_reached');
    expect(body.properties.feature).toBe('geofences');
    expect(body.properties).not.toHaveProperty('email');
    expect(body.properties).not.toHaveProperty('coordinates');
    expect(body.properties).not.toHaveProperty('imei');
  });

  test('does not send an event without an opaque identity', async () => {
    const fetchImpl = jest.fn();
    const sink = new PostHogProductEventSink({ token: 'test-token', fetchImpl: fetchImpl as unknown as typeof fetch });
    await sink.emit(createProductEvent('feature_used', { feature: 'geofences' }));
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
