import { describe, it, expect } from 'vitest';
import { MTLSService, type MTLSConfig } from '../src/security/mtls.js';

describe('Mutual TLS (mTLS) Service', () => {
  it('should build HTTPS server options with mutual auth flags', () => {
    const config: MTLSConfig = {
      enabled: true,
      cert: '-----BEGIN CERTIFICATE-----\nMOCK_CERT\n-----END CERTIFICATE-----',
      key: '-----BEGIN PRIVATE KEY-----\nMOCK_KEY\n-----END PRIVATE KEY-----',
      ca: '-----BEGIN CERTIFICATE-----\nMOCK_CA\n-----END CERTIFICATE-----',
      requestCert: true,
      rejectUnauthorized: true,
    };

    const options = MTLSService.buildServerOptions(config);
    expect(options.cert).toContain('MOCK_CERT');
    expect(options.key).toContain('MOCK_KEY');
    expect(options.ca).toContain('MOCK_CA');
    expect(options.requestCert).toBe(true);
    expect(options.rejectUnauthorized).toBe(true);
  });

  it('should reject verification if peer certificate is absent or non-TLS', () => {
    const mockReq = { socket: {} } as any;
    const result = MTLSService.verifyClientCertificate(mockReq, { enabled: true });
    expect(result.authorized).toBe(false);
    expect(result.reason).toContain('Non-TLS');
  });

  it('should reject verification if client certificate is untrusted', () => {
    const mockSocket = {
      getPeerCertificate: () => ({ subject: { CN: 'untrusted-client' } }),
      authorized: false,
      authorizationError: new Error('SELF_SIGNED_CERT_IN_CHAIN'),
    };
    const mockReq = { socket: mockSocket } as any;

    const result = MTLSService.verifyClientCertificate(mockReq, { enabled: true });
    expect(result.authorized).toBe(false);
    expect(result.reason).toContain('SELF_SIGNED_CERT_IN_CHAIN');
  });

  it('should verify authorized client certificate successfully', () => {
    const mockSocket = {
      getPeerCertificate: () => ({
        subject: { CN: 'gateway-client-prod', O: 'Enterprise Corp', OU: 'AI Ops' },
        issuer: { CN: 'Enterprise Root CA', O: 'Enterprise Corp' },
        valid_from: '2026-01-01',
        valid_to: '2028-01-01',
        fingerprint256: 'AA:BB:CC:DD:EE:FF',
        serialNumber: '123456789',
      }),
      authorized: true,
    };
    const mockReq = { socket: mockSocket } as any;

    const result = MTLSService.verifyClientCertificate(mockReq, { enabled: true });
    expect(result.authorized).toBe(true);
    expect(result.cert?.subject.CN).toBe('gateway-client-prod');
    expect(result.cert?.fingerprint256).toBe('AA:BB:CC:DD:EE:FF');
  });

  it('should enforce allowedCommonNames whitelist if specified', () => {
    const mockSocket = {
      getPeerCertificate: () => ({
        subject: { CN: 'unauthorized-machine' },
        issuer: { CN: 'Enterprise Root CA' },
        fingerprint256: '00:11:22',
      }),
      authorized: true,
    };
    const mockReq = { socket: mockSocket } as any;

    const result = MTLSService.verifyClientCertificate(mockReq, {
      enabled: true,
      allowedCommonNames: ['trusted-k8s-pod', 'gateway-client-prod'],
    });

    expect(result.authorized).toBe(false);
    expect(result.reason).toContain('not in allowed Common Names whitelist');
  });

  it('should enforce allowedFingerprints whitelist if specified', () => {
    const mockSocket = {
      getPeerCertificate: () => ({
        subject: { CN: 'trusted-k8s-pod' },
        issuer: { CN: 'Enterprise Root CA' },
        fingerprint256: '11:22:33:44',
      }),
      authorized: true,
    };
    const mockReq = { socket: mockSocket } as any;

    const result = MTLSService.verifyClientCertificate(mockReq, {
      enabled: true,
      allowedCommonNames: ['trusted-k8s-pod'],
      allowedFingerprints: ['99:88:77:66'],
    });

    expect(result.authorized).toBe(false);
    expect(result.reason).toContain('not in allowed fingerprints whitelist');
  });
});
