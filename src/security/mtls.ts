import fs from 'node:fs';
import https from 'node:https';
import type { TLSSocket } from 'node:tls';
import type { IncomingMessage } from 'node:http';

export interface MTLSConfig {
  enabled: boolean;
  cert?: string; // Certificate path or PEM content
  key?: string; // Private key path or PEM content
  ca?: string | string[]; // CA path, CA PEM content, or array of them
  requestCert?: boolean; // Request client certificate (default true)
  rejectUnauthorized?: boolean; // Reject connections if client cert is untrusted (default true)
  allowedCommonNames?: string[]; // Optional whitelist of client Common Names (CN)
  allowedFingerprints?: string[]; // Optional whitelist of client certificate SHA-256 fingerprints
}

export interface ClientCertificateInfo {
  subject: {
    CN?: string;
    O?: string;
    OU?: string;
  };
  issuer: {
    CN?: string;
    O?: string;
  };
  validFrom: string;
  validTo: string;
  fingerprint256: string;
  serialNumber: string;
  authorized: boolean;
}

export class MTLSService {
  /**
   * Resolves raw PEM content or reads from file path if it exists
   */
  static resolvePem(input?: string): string | undefined {
    if (!input) return undefined;
    if (input.includes('BEGIN CERTIFICATE') || input.includes('BEGIN PRIVATE KEY') || input.includes('BEGIN RSA PRIVATE KEY')) {
      return input;
    }
    if (fs.existsSync(input)) {
      return fs.readFileSync(input, 'utf8');
    }
    return input;
  }

  static buildServerOptions(config: MTLSConfig): https.ServerOptions {
    const cert = MTLSService.resolvePem(config.cert);
    const key = MTLSService.resolvePem(config.key);

    let ca: string[] | string | undefined;
    if (Array.isArray(config.ca)) {
      ca = config.ca.map((c) => MTLSService.resolvePem(c) || c);
    } else if (config.ca) {
      ca = MTLSService.resolvePem(config.ca);
    }

    return {
      cert,
      key,
      ca,
      requestCert: config.requestCert !== false,
      rejectUnauthorized: config.rejectUnauthorized !== false,
    };
  }

  /**
   * Extracts certificate details and verifies authorization & whitelists
   */
  static verifyClientCertificate(
    req: IncomingMessage,
    config: MTLSConfig
  ): { authorized: boolean; reason?: string; cert?: ClientCertificateInfo } {
    const socket = req.socket as TLSSocket;
    if (!socket || typeof socket.getPeerCertificate !== 'function') {
      return { authorized: false, reason: 'Non-TLS connection or peer certificate not available' };
    }

    const peer = socket.getPeerCertificate();
    if (!peer || Object.keys(peer).length === 0) {
      return { authorized: false, reason: 'Client certificate not provided' };
    }

    const isAuthorized = socket.authorized !== false;
    if (!isAuthorized) {
      return {
        authorized: false,
        reason: socket.authorizationError ? socket.authorizationError.message : 'Client certificate untrusted by CA',
      };
    }

    const certInfo: ClientCertificateInfo = {
      subject: {
        CN: peer.subject?.CN,
        O: peer.subject?.O,
        OU: peer.subject?.OU,
      },
      issuer: {
        CN: peer.issuer?.CN,
        O: peer.issuer?.O,
      },
      validFrom: peer.valid_from || '',
      validTo: peer.valid_to || '',
      fingerprint256: peer.fingerprint256 || peer.fingerprint || '',
      serialNumber: peer.serialNumber || '',
      authorized: true,
    };

    // Check Common Name (CN) whitelist if configured
    if (config.allowedCommonNames && config.allowedCommonNames.length > 0) {
      const clientCN = certInfo.subject.CN;
      if (!clientCN || !config.allowedCommonNames.includes(clientCN)) {
        return {
          authorized: false,
          reason: `Client CN '${clientCN}' is not in allowed Common Names whitelist`,
          cert: certInfo,
        };
      }
    }

    // Check Fingerprint whitelist if configured
    if (config.allowedFingerprints && config.allowedFingerprints.length > 0) {
      const fp = certInfo.fingerprint256.toUpperCase();
      const match = config.allowedFingerprints.some((allowed) => allowed.toUpperCase() === fp);
      if (!match) {
        return {
          authorized: false,
          reason: `Client certificate fingerprint ${fp} is not in allowed fingerprints whitelist`,
          cert: certInfo,
        };
      }
    }

    return { authorized: true, cert: certInfo };
  }
}
