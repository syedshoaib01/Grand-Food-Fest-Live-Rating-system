# Grand Food Fest V1 — Implementation Plan & Architecture Changes

This document details the executed implementation phases for security hardening, performance optimization, data privacy, and production readiness for the Grand Food Fest Live Rating System.

---

## Architecture Summary

```
                ┌───────────────────────────┐
                │   Attendee Mobile Phone   │
                │  (360x800 to 430x932 px)  │
                └─────────────┬─────────────┘
                              │ HTTPS (secure cookie: gff_session)
                              ▼
                ┌───────────────────────────┐
                │ Next.js 14 App Router     │
                │ • Bottom Nav Touch UI     │
                │ • Idempotency-Key Header  │
                │ • Zero 5-Star Defaults    │
                └─────────────┬─────────────┘
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
   ┌───────────────────────┐     ┌───────────────────────┐
   │  Voting Engine        │     │  Ranking Engine       │
   │  • Quota Check (<=5)  │     │  • Bayesian Scoring   │
   │  • Row-Lock on Session│     │  • SQL GroupBy / Agg  │
   │  • In-Place Upsert    │     │  • Truthful Snapshots │
   │  • Lifestyle Rejected │     │  • Threshold Gate (20)│
   └───────────┬───────────┘     └───────────┬───────────┘
               │                             │
               └──────────────┬──────────────┘
                              ▼
               ┌───────────────────────────┐
               │    Prisma ORM 5.22        │
               │  • SQLite (Dev)           │
               │  • PostgreSQL (Prod)      │
               └───────────────────────────┘
```

---

## Phase Execution Breakdown

### Phase 1: Security & Cryptographic Hardening (P0)
- **`src/lib/auth.ts`**:
  - Added server-side token expiry validation (`ADMIN_SESSION_MAX_AGE_MS = 24h`, `ATTENDEE_SESSION_MAX_AGE_MS = 72h`).
  - Added timestamp clock skew protection (>5 min rejected).
  - Added production warnings for default / weak secrets.
  - Exported `ADMIN_SESSION_MAX_AGE_MS` and `ATTENDEE_SESSION_MAX_AGE_MS`.
- **`src/lib/voting-engine.ts`**:
  - Persisted anonymized pass tokens (`ATT-••••-XXXX`) instead of plaintext passes.
  - Added row-level lock update on `AttendeeSession` inside interactive transaction to prevent race conditions.
- **Route Handlers**:
  - `src/app/api/voting/verify/route.ts`: Added `secure: process.env.NODE_ENV === "production"`.
  - `src/app/api/voting/ratings/route.ts`: Added `secure: process.env.NODE_ENV === "production"`.
  - `src/app/api/admin/auth/route.ts`: Added `secure: process.env.NODE_ENV === "production"`.

### Phase 2: Database Portability & PostgreSQL Readiness
- Created `prisma/schema.postgresql.prisma` with `provider = "postgresql"`.
- Verified type compatibility across all models.
- Documented migration procedure and environment switching.

### Phase 3: UI/UX Privacy & Correctness
- **`src/components/Navbar.tsx`**:
  - Masked pass token display (`ATT-••••-XXXX`).
- **`src/app/vote/page.tsx`**:
  - Masked pass token in active quota card.
  - Generated client-side `Idempotency-Key` via `crypto.randomUUID()`.
  - Replaced random-pass generator on "Switch" button with clean `logout()` and reset flow.
  - Eliminated `selectedVendors` state dependency loop in URL parameter effect.
- **`src/app/api/admin/anomalies/route.ts`**:
  - Used authenticated admin's email (`auth.admin.email`) for anomaly resolutions.
- **`src/lib/trending-engine.ts`**:
  - Fixed fallback labeling to avoid false 30-minute velocity claims when using historical data.

### Phase 4: Performance & Observability
- **`src/lib/ranking-engine.ts`**:
  - Replaced full-table scan with `prisma.rating.aggregate` and `prisma.rating.groupBy`.
- **`src/app/api/vendors/route.ts`**:
  - Replaced ratings array loading with targeted `groupBy` on current vendor IDs.
- **`src/lib/logger.ts`**:
  - Created structured logger with JSON output in production.
- **`src/app/api/health/route.ts`**:
  - Created health check endpoint monitoring DB connectivity and latency.

### Phase 5: Verification & Testing
- Added `vitest.config.ts` with `@/*` path aliases.
- Created `src/tests/audit-improvements.test.ts` (11 new tests covering expiry, anonymization, health check, and concurrency).
- Total test count: 35 passing tests across 4 test suites.
- Production build: Clean compilation of all 32 routes.
