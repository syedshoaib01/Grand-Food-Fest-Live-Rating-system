import * as crypto from "crypto";

const PASS_SALT = process.env.PASS_SALT || "gff-salt-2026-hyderabad";
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || "gff-secret-jwt-key-hyderabad-2026-very-secure";

/**
 * Deterministically hash an event pass token (e.g. PASS-000001)
 * Preserves voter anonymity while providing consistent session mapping.
 */
export function hashPassToken(passToken: string): string {
  const normalized = passToken.trim().toUpperCase();
  return crypto.createHash("sha256").update(normalized + PASS_SALT).digest("hex");
}

/**
 * Simple HMAC-SHA256 signature for admin and attendee session cookies
 */
export function signSessionPayload(payload: Record<string, any>): string {
  const dataStr = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", ADMIN_JWT_SECRET)
    .update(dataStr)
    .digest("base64url");
  return `${dataStr}.${signature}`;
}

export function verifySessionPayload<T = any>(token: string): T | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [dataStr, signature] = parts;
    const expectedSig = crypto
      .createHmac("sha256", ADMIN_JWT_SECRET)
      .update(dataStr)
      .digest("base64url");

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }

    const json = Buffer.from(dataStr, "base64url").toString("utf-8");
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
