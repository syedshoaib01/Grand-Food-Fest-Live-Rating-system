# Grand Food Fest — Prioritized Improvement Plan & Audit Resolutions

This document catalogs all technical debt, security issues, performance bottlenecks, and UX challenges discovered during the first-principles audit, along with their resolution status.

---

## Prioritized Matrix

| ID | Category | Issue | Severity | Status | Verified In |
|---|---|---|---|---|---|
| **SEC-001** | Security | Default secrets warning in `.env` | P0 (Critical) | ✅ Resolved | `auth.ts` / production checklist |
| **SEC-002** | Security | Admin password protection | P0 (Critical) | ✅ Resolved | `auth.ts` (PBKDF2) |
| **SEC-003** | Security | HMAC session tokens lacked expiry | P0 (High) | ✅ Resolved | `auth.ts` + `audit-improvements.test.ts` |
| **SEC-004** | Privacy | Plaintext `passToken` stored in DB | P0 (High) | ✅ Resolved | `voting-engine.ts` + `schema.prisma` |
| **SEC-005** | Security | Session cookies missing `secure` flag | P0 (High) | ✅ Resolved | `verify/route.ts`, `ratings/route.ts`, `auth/route.ts` |
| **VOTE-001** | Concurrency | Quota enforcement race condition | P0 (Critical) | ✅ Resolved | Row-level locking in `voting-engine.ts` |
| **DB-001** | Scalability | SQLite concurrency limitations | P0 (Critical) | ✅ Resolved | PostgreSQL schema & migration guide |
| **VOTE-003** | Resilience | Missing client-side idempotency keys | P1 (Medium) | ✅ Resolved | `vote/page.tsx` (`crypto.randomUUID`) |
| **UX-001** | Privacy | Raw pass token displayed in navbar/UI | P1 (High) | ✅ Resolved | `Navbar.tsx`, `vote/page.tsx` |
| **UX-002** | UX | "Switch" button generated random passes | P1 (High) | ✅ Resolved | `vote/page.tsx` (proper logout & reset flow) |
| **API-001** | Correctness | Hardcoded admin email in anomaly dismiss | P1 (Medium) | ✅ Resolved | `admin/anomalies/route.ts` (`auth.admin.email`) |
| **API-003** | Portability | Vendor search without insensitive flag | P1 (Low) | ✅ Resolved | `vendors/route.ts` |
| **TREND-001**| Analytics | Trending fallback claimed 30-min window | P1 (Low) | ✅ Resolved | `trending-engine.ts` (truthful labeling) |
| **PERF-001** | Performance | Leaderboard loaded all ratings to memory | P2 (Medium) | ✅ Resolved | `ranking-engine.ts` (`aggregate` + `groupBy`) |
| **PERF-003** | Performance | Vendor list API fetched all ratings | P2 (Medium) | ✅ Resolved | `vendors/route.ts` (rating aggregation) |
| **OBS-001** | Observability | Missing structured error logging | P2 (Medium) | ✅ Resolved | `src/lib/logger.ts` |
| **OBS-002** | Observability | Missing health check endpoint | P2 (Low) | ✅ Resolved | `src/app/api/health/route.ts` |

---

## Detailed Resolutions

### 1. SEC-003: Server-Side Token Expiry
- **Resolution**: `verifySessionPayload()` now inspects the token's `timestamp` and `exp` fields.
  - Admin sessions strictly expire after 24 hours (`ADMIN_SESSION_MAX_AGE_MS = 86,400,000 ms`).
  - Attendee sessions expire after 72 hours (`ATTENDEE_SESSION_MAX_AGE_MS = 259,200,000 ms`).
  - Excessive future timestamps (>5 minutes clock skew) are automatically rejected.
  - `requireAdmin(req)` strictly validates 24h expiration.

### 2. SEC-004: Pass Token Masking in Persistence
- **Resolution**: `getOrCreateAttendeeSession()` and `seed.ts` now sanitize pass tokens upon creation.
  - Raw tokens (e.g. `PASS-000001`) are hashed to `passHash` for identity lookup.
  - The persisted `passToken` field is stored as `ATT-••••-0001`.
  - Stolen database dumps cannot be used to clone festival admission passes.

### 3. VOTE-001: Quota Transaction Row-Level Locking
- **Resolution**: Within the interactive database transaction `prisma.$transaction`, the engine performs:
  ```typescript
  await tx.attendeeSession.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
  });
  ```
  In PostgreSQL, this executes an exclusive row write lock (`FOR UPDATE` equivalent). Parallel requests attempting to submit votes for the same session must wait sequentially, ensuring the second request reads the updated rating count and enforces the 5-vendor limit.

### 4. PERF-001 & PERF-003: Database-Level Aggregation
- **Resolution**:
  - Replaced full-table `findMany` queries in `ranking-engine.ts` with `prisma.rating.aggregate` and `prisma.rating.groupBy`.
  - Replaced rating array loading in `api/vendors` with selective `groupBy` on requested vendor IDs.
  - Reduces memory overhead and serialization from hundreds of thousands of objects to only 160 aggregated records.

### 5. OBS-001 & OBS-002: Observability & Health Check
- **Resolution**:
  - Implemented `src/lib/logger.ts` emitting structured JSON in production and readable formats in dev.
  - Implemented `GET /api/health` providing real-time database connectivity status, latency metrics, and event state.
