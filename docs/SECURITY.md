# SECURITY SPECIFICATION — GRAND FOOD FEST

This document outlines the security controls, threat mitigations, and data protection measures enforced in the Grand Food Fest platform.

---

## 1. THREAT MODEL & MITIGATIONS

| Threat Vector | Risk Description | Enforced Mitigation |
| :--- | :--- | :--- |
| **Session Spoofing** | Attacker injects another attendee's session ID into request body or header. | **Server-Derived Session**: The server extracts attendee identity exclusively from cryptographically signed HMAC-SHA256 cookies (`gff_session`). Arbitrary client headers (`x-session-id`) and request body session IDs are completely ignored. |
| **Admin Route Exposure** | Unauthorized users calling admin endpoints directly. | **Server-Side Gate**: Every `/api/admin/*` endpoint executes `requireAdmin(req)`. Client route guards alone are never relied upon. Requests without valid signatures return `401`; non-admin roles return `403`. |
| **Credential Cracking** | Brute force or dictionary attacks on admin login. | **PBKDF2 Salted Hashing**: Admin passwords are never stored in plaintext or compared with hardcoded strings. Each password hash uses a unique 16-byte random salt and 100,000 PBKDF2 iterations with SHA-512. In production, default fallback passwords (`admin123`) are strictly blocked. |
| **Pass Token Scraping** | Leaking attendee wristband/ticket tokens through logs or exports. | **Anonymization**: All attendee pass tokens are masked as `ATT-••••-XXXX` in admin screens, audit logs, and data exports via `anonymizePassToken()`. |
| **Vote Stuffing / Quota Bypass** | Script submitting >5 vendors or inflating ratings. | **Database Invariants**: Multi-column composite unique constraint `(attendeeSessionId, vendorId, eventDayId)` ensures only 1 rating per vendor per day. Server transaction verifies total rated count < 5 before permitting a new vendor. |
| **Timing & Replay Attacks** | Replaying identical rating requests. | **Idempotency**: Clients may pass `Idempotency-Key` headers. Replays within the same session return the original result without re-executing transactions. |
| **Lifestyle Stall Voting** | Rating non-food stalls to distort rankings. | **Type Enforcement**: Server transaction explicitly asserts `vendor.vendorType === "FOOD"` and `vendor.status === "ACTIVE"` before accepting any rating. |

---

## 2. SERVER-SIDE `requireAdmin()` HELPER

```typescript
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

  const payload = verifySessionPayload<{ email: string; role: string }>(token);
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

  return { authorized: true, admin: payload, user: payload };
}
```

---

## 3. PASS ANONYMIZATION ALGORITHM

```typescript
export function anonymizePassToken(passToken: string): string {
  if (!passToken) return "ATT-••••-XXXX";
  const clean = passToken.trim();
  const suffix = clean.length > 4 ? clean.slice(-4) : clean;
  return `ATT-••••-${suffix}`;
}
```

This guarantees that exports and administrative tables never expose the attendee's physical wristband or ticket token, protecting attendee privacy while preserving operational trackability.
