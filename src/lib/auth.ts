import * as crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

// Default fallback secrets with production warning
const PASS_SALT = process.env.PASS_SALT || "gff-salt-2026-hyderabad";
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || "gff-secret-jwt-key-hyderabad-2026-very-secure";

if (process.env.NODE_ENV === "production") {
  if (!process.env.ADMIN_JWT_SECRET || process.env.ADMIN_JWT_SECRET.includes("gff-secret-jwt-key")) {
    console.warn("[SECURITY NOTICE] ADMIN_JWT_SECRET should be set to a cryptographically secure random secret in live production environments.");
  }
  if (!process.env.PASS_SALT || process.env.PASS_SALT.includes("gff-salt-2026")) {
    console.warn("[SECURITY NOTICE] PASS_SALT should be set to a cryptographically secure salt in live production environments.");
  }
}

/**
 * Deterministically hash an event pass token (e.g. PASS-000001)
 * Preserves voter anonymity while providing consistent session mapping.
 */
export function hashPassToken(passToken: string): string {
  const normalized = passToken.trim().toUpperCase();
  return crypto.createHash("sha256").update(normalized + PASS_SALT).digest("hex");
}

/**
 * Anonymizes raw pass tokens for display in admin panels, UI, and exports.
 * e.g. "PASS-000123" -> "ATT-••••-0123"
 */
export function anonymizePassToken(token: string | null | undefined): string {
  if (!token) return "ATT-••••-ANON";
  const clean = token.trim();
  if (clean.startsWith("ATT-••••")) return clean; // Already anonymized
  if (clean.length <= 4) return "ATT-••••";
  const suffix = clean.slice(-4);
  return `ATT-••••-${suffix}`;
}

/**
 * Cryptographic password hashing using PBKDF2 with random 16-byte salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Cryptographic password verification against PBKDF2 salt:hash format
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    if (!storedHash || !storedHash.includes(":")) return false;
    const [salt, originalHash] = storedHash.split(":");
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(originalHash));
  } catch {
    return false;
  }
}

/**
 * Default session maximum age durations (in milliseconds)
 */
export const ADMIN_SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
export const ATTENDEE_SESSION_MAX_AGE_MS = 72 * 60 * 60 * 1000; // 72 hours (3 festival days)

export interface VerifySessionOptions {
  maxAgeMs?: number;
}

/**
 * HMAC-SHA256 signature for admin and attendee session cookies
 */
export function signSessionPayload(payload: Record<string, any>): string {
  const enriched = {
    timestamp: Date.now(),
    ...payload,
  };
  const dataStr = Buffer.from(JSON.stringify(enriched)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", ADMIN_JWT_SECRET)
    .update(dataStr)
    .digest("base64url");
  return `${dataStr}.${signature}`;
}

export function verifySessionPayload<T = any>(
  token: string,
  options?: VerifySessionOptions
): T | null {
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
    const payload = JSON.parse(json) as T & { timestamp?: number; exp?: number; role?: string };

    const now = Date.now();

    // 1. Explicit exp check
    if (typeof payload.exp === "number" && now > payload.exp) {
      return null;
    }

    // 2. Timestamp age check
    if (typeof payload.timestamp === "number") {
      // Reject if timestamp is unreasonably far in the future (>5 min clock skew)
      if (payload.timestamp - now > 5 * 60 * 1000) {
        return null;
      }

      let maxAge = options?.maxAgeMs;
      if (maxAge === undefined) {
        // Apply role-based default TTL
        maxAge = payload.role === "ADMIN" ? ADMIN_SESSION_MAX_AGE_MS : ATTENDEE_SESSION_MAX_AGE_MS;
      }

      if (maxAge > 0 && now - payload.timestamp > maxAge) {
        return null;
      }
    } else if (options?.maxAgeMs !== undefined) {
      // If maxAge was explicitly demanded but payload has no timestamp, reject
      return null;
    }

    return payload as T;
  } catch {
    return null;
  }
}

/**
 * Reusable server-side gate for all /api/admin/* endpoints
 */
export async function requireAdmin(req: NextRequest): Promise<
  | { authorized: true; admin: { email: string; role: string }; user: { email: string; role: string } }
  | { authorized: false; response: NextResponse }
> {
  const cookie = req.cookies.get("gff_admin")?.value;
  const authHeader = req.headers.get("authorization");
  let token = cookie;

  if (!token && authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  }

  if (!token) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Unauthorized. Administrator session required." },
        { status: 401 }
      ),
    };
  }

  const payload = verifySessionPayload<{ email: string; role: string }>(token, {
    maxAgeMs: ADMIN_SESSION_MAX_AGE_MS,
  });
  if (!payload) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Unauthorized. Invalid or expired administrator credentials." },
        { status: 401 }
      ),
    };
  }

  if (payload.role !== "ADMIN") {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Forbidden. Administrator privileges required." },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    admin: payload,
    user: payload,
  };
}
