# Security Policy

## Supported Versions

We release patches and security fixes for the latest stable release of OpenKey.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability or potential credential leak in OpenKey:

1. **Do not create a public GitHub issue.**
2. Send an email with reproduction details and proof-of-concept to `security@openkey.dev` (or open a GitHub Private Security Advisory).
3. We will acknowledge receipt within 48 hours and work with you on a coordinated disclosure.

## Security Architecture Guarantee

- OpenKey will never transmit your raw API keys to external servers other than the explicit AI provider endpoints you have configured.
- OpenKey stores secrets locally in an AES-256-GCM encrypted SQLite vault.
- All internal logs, errors, and UI strings are scrubbed through a central sanitization layer.
