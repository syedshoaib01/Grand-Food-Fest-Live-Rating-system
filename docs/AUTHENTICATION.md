# AUTHENTICATION SPECIFICATION — GRAND FOOD FEST

This document details the identity architecture, token lifecycles, and session verification mechanisms for attendees and administrators.

---

## 1. ATTENDEE IDENTITY MODEL

Festival attendees do not have traditional email/password user accounts. Instead, they use a **low-friction anonymous session model** tied to their physical entry ticket or RFID wristband.

```text
Physical Ticket / Wristband Token (e.g. PASS-000001)
                    ↓
Normalized & Salted SHA-256 Hashing (passHash)
                    ↓
Anonymous AttendeeSession per EventDay (passHash_eventDayId)
                    ↓
Cryptographically Signed HMAC Cookie (gff_session)
```

### Token Lifecycle:
1. **Pass Verification (`POST /api/voting/verify`)**:
   * Accepts normalized token string matching `^[A-Z0-9_-]{4,32}$`.
   * Computes deterministic SHA-256 hash using `PASS_SALT`.
   * Upserts `AttendeeSession` record linked to active `eventDayId`.
   * Signs payload `{ sessionId, passToken, eventDayId }` using HMAC-SHA256 with `ADMIN_JWT_SECRET`.
   * Sets HTTP-only, `SameSite=lax` cookie named `gff_session` with a 3-day max age.
2. **Session Persistence**:
   * Subsequent API requests (`GET /api/voting/session`, `POST /api/voting/ratings`) read and cryptographically verify `gff_session`.
   * Tampered signatures fail verification immediately.

---

## 2. ADMINISTRATOR AUTHENTICATION

Administrators authenticate via `POST /api/admin/auth`.

### Password Security:
* Passwords are never compared in plaintext.
* Stored in database `AdminUser.passwordHash` as `salt:hash`:
  * Salt: 16 bytes cryptographically random hex.
  * Hash: PBKDF2 with 100,000 iterations, 64-byte key length, and SHA-512 digest.
* When verifying: `verifyPassword(inputPassword, storedHash)` extracts the stored salt, re-hashes the input password, and executes constant-time buffer comparison.

### Admin Session:
* Successful authentication issues a signed `gff_admin` HTTP-only cookie with payload `{ email, role: "ADMIN", timestamp }`.
* Max age: 24 hours.
* Logout (`DELETE /api/admin/auth`) explicitly clears the cookie.
