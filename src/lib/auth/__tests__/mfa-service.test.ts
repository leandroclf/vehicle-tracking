import { mfaService } from '../mfa-service';

const queryMock = jest.fn();
const releaseMock = jest.fn();

jest.mock('@/lib/database', () => ({
  getConnection: jest.fn(async () => ({
    query: queryMock,
    release: releaseMock,
  })),
}));

describe('mfaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns disabled status when there is no MFA config', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });

    const status = await mfaService.getMFAStatus('user-1');

    expect(status.enabled).toBe(false);
    expect(status.providers.sms.enabled).toBe(false);
    expect(releaseMock).toHaveBeenCalled();
  });

  it('returns enabled status from stored config', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{
        enabled: true,
        sms_enabled: true,
        sms_phone: '+5565999887766',
        totp_enabled: false,
        email_enabled: true,
        email_address: 'test@example.com',
        backup_codes_count: 2,
        backup_codes_last_used: new Date('2025-01-01T00:00:00.000Z'),
      }],
    });

    const status = await mfaService.getMFAStatus('user-1');

    expect(status.enabled).toBe(true);
    expect(status.providers.sms.phone).toBe('+5565999887766');
    expect(status.providers.email.email).toBe('test@example.com');
    expect(status.backupCodes.count).toBe(2);
  });

  it('generates 10 backup codes with 8 characters each', () => {
    const codes = mfaService.generateBackupCodes();

    expect(codes).toHaveLength(10);
    codes.forEach((code) => {
      expect(code).toMatch(/^[A-Z0-9]{8}$/);
    });
  });
});
