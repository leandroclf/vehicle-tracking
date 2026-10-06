import { HubSpotSalesSignalSink } from '../hubspot';

describe('HubSpotSalesSignalSink', () => {
  test('resolves PII only at CRM delivery boundary', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    const resolveIdentity = jest.fn().mockResolvedValue({ email: 'lead@example.com', name: 'Lead' });
    const sink = new HubSpotSalesSignalSink({ accessToken: 'token', resolveIdentity, fetchImpl: fetchImpl as unknown as typeof fetch });

    await sink.emit({
      idempotencyKey: 'vehicle-tracking:acct:limit_reached:geofences:2026-10-06',
      kind: 'usage_limit_reached',
      accountId: 'acct',
      feature: 'geofences',
      planId: 'free',
      occurredAt: '2026-10-06T10:00:00Z',
    });

    expect(resolveIdentity).toHaveBeenCalledWith('acct');
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body as string);
    expect(body.inputs[0].idProperty).toBe('email');
    expect(body.inputs[0].properties.email).toBe('lead@example.com');
  });
});
