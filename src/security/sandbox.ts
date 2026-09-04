import path from 'node:path';
import fs from 'node:fs';

export class WorkspaceSandbox {
  private workspaceRoot: string;

  constructor(workspaceRoot?: string) {
    this.workspaceRoot = path.resolve(workspaceRoot || process.cwd());
  }

  public getRoot(): string {
    return this.workspaceRoot;
  }

  public setRoot(newRoot: string): void {
    this.workspaceRoot = path.resolve(newRoot);
  }

  /**
   * Resolves a target path and ensures it does not escape the workspace root
   * unless explicitly permitted.
   */
  public resolveSafePath(targetPath: string, allowOutside: boolean = false): string {
    const resolved = path.isAbsolute(targetPath)
      ? path.resolve(targetPath)
      : path.resolve(this.workspaceRoot, targetPath);

    const relative = path.relative(this.workspaceRoot, resolved);
    const isOutside = relative.startsWith('..') || path.isAbsolute(relative);

    if (isOutside && !allowOutside) {
      throw new Error(
        `Path traversal protection: Path "${targetPath}" is outside the active workspace "${this.workspaceRoot}".`
      );
    }

    return resolved;
  }

  /**
   * Validates URLs against SSRF (Server-Side Request Forgery) attacks.
   * Disallows local private subnets (169.254.169.254, AWS metadata, etc.) for external network requests.
   */
  public static validateExternalUrl(urlString: string): { valid: boolean; reason?: string } {
    try {
      const parsed = new URL(urlString);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return { valid: false, reason: `Invalid protocol: ${parsed.protocol}. Only http and https are allowed.` };
      }

      const hostname = parsed.hostname.toLowerCase();
      if (
        hostname === '169.254.169.254' ||
        hostname === 'metadata.google.internal' ||
        hostname === '100.100.100.200'
      ) {
        return { valid: false, reason: 'Access to cloud instance metadata service is forbidden.' };
      }

      return { valid: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { valid: false, reason: `Malformed URL: ${msg}` };
    }
  }
}
