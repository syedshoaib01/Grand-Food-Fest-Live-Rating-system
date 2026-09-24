# Grand Food Fest — Production Readiness & Deployment Runbook

This guide contains the non-negotiable checklist, infrastructure configuration, verified readiness status, and incident runbooks required to deploy Grand Food Fest Live Rating System for live production at Gachibowli Stadium, Hyderabad.

---

## 1. Production Readiness Verification Matrix

Every core subsystem has been audited and tested against live PostgreSQL:

| Subsystem | Readiness Status | Evidence / Verification |
|---|---|---|
| **Security** | **VERIFIED** | PBKDF2 salted password hashing, HMAC SHA-256 session cookies with 24h (admin) / 72h (attendee) strict server-side TTL, `secure: true` in production, `httpOnly`, `sameSite: "lax"`, raw pass masking to `ATT-••••-XXXX`, strict `requireAdmin()` on all `/api/admin/*` routes. Verified in `src/tests/hardening-and-security.test.ts` & `src/tests/api-security.test.ts`. |
| **PostgreSQL (Supabase)** | **VERIFIED** | **Authoritative production database hosted on Supabase (PostgreSQL 17.6 in AWS ap-south-1 Mumbai)**. Schema unified with `provider = "postgresql"` and `directUrl = env("DIRECT_URL")`. Checked-in Prisma migrations in `prisma/migrations/20260922104355_init/migration.sql`. Deployed remotely via `npx prisma migrate deploy`. All 10 models + 108 constraints confirmed intact on remote database. |
| **Concurrency** | **VERIFIED** | Strict 5-stalls/day quota invariant guaranteed under concurrent burst traffic via interactive database transaction row-level locking (`FOR UPDATE` equivalent on `AttendeeSession`). Parallel requests serialize cleanly. 0 quota leaks under stress. Verified directly against Supabase in `src/tests/concurrency-quota.test.ts` and `src/tests/load-simulation.test.ts`. |
| **Performance** | **VERIFIED** | SQL-level `groupBy` and `aggregate` eliminate Node heap memory exhaustion. Live leaderboard includes 5-second in-memory caching (`getLiveLeaderboard()`), and vendor detail page rank lookup uses efficient cached index (`useCache: true`). Handled 200 concurrent transactions in load simulation against Supabase with zero quota leaks. |
| **Rate Limiting** | **VERIFIED** | Public voting endpoints (`/api/voting/verify`, `/api/voting/ratings`) protected by sliding-window IP rate limiter (`src/lib/rate-limiter.ts`) returning `429 Too Many Requests` with safe error payload. Verified against live server. |
| **Deployment** | **VERIFIED** | Support for pooled runtime `DATABASE_URL` (Supabase Session Pooler port 5432 / Transaction Pooler 6543) and unpooled migration `DIRECT_URL`. Clean bootstrap via `npm run db:seed:prod` (164 official vendors, 3 event days, zero synthetic votes/passes). Build validated with `NEXT_PUBLIC_DEV_MODE=false npm run build`. |
| **Monitoring** | **VERIFIED** | `GET /api/health` queries live Supabase instance, reports latency (ms), active event state, and sanitized errors without exposing credentials. Structured logging (`src/lib/logger.ts`) formats single-line JSON in production. |
| **Voting Invariants**| **VERIFIED** | 1–5 integer stars, 0-star default (no auto 5-star), lifestyle stalls rejected, paused vendors rejected, idempotent updates on same-day resubmission, multi-day fresh quota reset. Verified against Supabase in `src/tests/voting-engine.test.ts`. |
| **Admin Controls** | **VERIFIED** | All admin APIs guarded by server-side authorization, real admin identity recorded in audit anomalies (`auth.admin.email`), CSV/JSON exports mask attendee tokens, festival status transitions enforced. |
| **Testing** | **VERIFIED** | 8 test files, 47 tests all passing against live Supabase PostgreSQL (`npm test`). Integration, concurrency, search, timezone, and load simulation tests included. |


---

## 2. Production Environment Variables Checklist

Before launching, verify all production secrets are generated using high-entropy random sources:

```bash
# Generate 256-bit secrets via openssl
openssl rand -hex 32  # Use for ADMIN_JWT_SECRET
openssl rand -hex 16  # Use for PASS_SALT
```

| Variable | Requirement | Example / Guidance |
|---|---|---|
| `NODE_ENV` | `production` | Enables cookie `secure: true`, JSON structured logs |
| `DATABASE_URL` | PostgreSQL Pooled URI | `postgresql://user:pass@pooler.neon.tech/grandfoodfest?sslmode=require&connection_limit=50` |
| `DIRECT_URL` | PostgreSQL Direct URI | `postgresql://user:pass@ep-direct.neon.tech/grandfoodfest?sslmode=require` (for migrations) |
| `ADMIN_JWT_SECRET` | 64-char hex string | Random cryptographically secure 256-bit key |
| `PASS_SALT` | 32-char hex string | Random cryptographically secure salt |
| `NEXT_PUBLIC_DEV_MODE` | `false` | Disables demo pass switcher, dev bar, debug controls |
| `ADMIN_EMAIL` | Production admin email | e.g. `lead-organizer@grandfoodfest.com` |
| `ADMIN_PASSWORD` | Strong password | Min 16 characters (seed creates hashed record in DB) |

> [!CAUTION]
> If `ADMIN_JWT_SECRET` contains `gff-secret-jwt-key` or `PASS_SALT` contains `gff-salt-2026`, the system will log a critical security notice. Never launch with default keys.

---

## 3. PostgreSQL Migration & Database Provisioning

PostgreSQL is the authoritative production database.

### Step-by-Step Deployment Runbook:
1. **Configure Database Connection**:
   Update `DATABASE_URL` (pooled) and `DIRECT_URL` (direct) in production deployment environment variables.
2. **Execute Checked-In Prisma Migrations**:
   ```bash
   npm run db:migrate
   # Or directly: npx prisma migrate deploy
   ```
   This executes `prisma/migrations/20260922104355_init/migration.sql` creating all tables, indexes, and unique constraints.
3. **Seed Real Festival Data**:
   ```bash
   npm run db:seed:prod
   ```
   Seeds the official 160+ food vendors across zones, creates Day 1/2/3 schedules (Day 1 set to `LIVE`), awards, and provisions the production admin user. No fake attendees or synthetic votes are generated.
4. **Verify Database Connectivity & Health**:
   ```bash
   curl -s https://your-domain.com/api/health
   ```
   Ensure `{"status": "ok", "database": {"status": "connected"}}` is returned.

---

## 4. Concurrency & Connection Pool Tuning

With thousands of attendees rating food stalls concurrently:

- **Prisma Connection Pooling**: Append `?connection_limit=40&pool_timeout=15` to `DATABASE_URL` if not using PgBouncer/Supabase pooler.
- **Row-Level Serialization**: Quota transactions lock the attendee's session row inside `prisma.$transaction`:
  ```typescript
  await tx.attendeeSession.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
  });
  ```
  This guarantees serial execution per attendee session, strictly enforcing `<= 5` stalls/day without race conditions.
- **SQL Aggregations & Caching**:
  - Bayesian leaderboard calculations use SQL `COUNT` and `SUM` groupings.
  - In-memory 5-second TTL cache in `getLiveLeaderboard()` prevents DB hammering during viral award moments.
  - Vendor detail endpoint uses cached rank lookups (`useCache: true`).

---

## 5. CDN & Caching Rules (Cloudflare / Vercel Edge)

- **Static Assets (`/_next/static/*`, `/images/*`, `/fonts/*`)**:
  - Cache-Control: `public, max-age=31536000, immutable`
- **Leaderboard API (`/api/leaderboard`, `/api/trending`)**:
  - Cache-Control: `public, s-maxage=5, stale-while-revalidate=10`
  - Keeps edge responses fast while respecting the 5-second server cache.
- **Voting Endpoints (`/api/voting/*`, `/api/admin/*`)**:
  - Cache-Control: `private, no-cache, no-store, must-revalidate`
  - Must never be cached by edge CDNs.

---

## 6. Monitoring & Health Checks

- **Health Endpoint**: `GET /api/health`
  - Automated ping every 30 seconds by Uptime monitoring.
  - Reports `database.latencyMs` and active event state.
  - Never leaks connection strings or internal errors.
- **Anomaly Detection**:
  - Admin dashboard automatically scans `/admin/anomalies` for velocity spikes (>20 ratings/10 min) or rating clusters.
- **Structured Logs**:
  - Formatted as single-line JSON in production (`src/lib/logger.ts`), ingestible by Datadog, CloudWatch, or Grafana Loki.

---

## 7. Emergency Runbook: Incident Responses

### Scenario A: A vendor is caught bribing attendees / ballot stuffing
1. Navigate to `/admin/anomalies`.
2. Inspect the flagged vendor's rating velocity and timestamps.
3. Click **"Invalidate Suspicious Ratings"** to invalidate fraudulent votes in bulk (`isValid = false`).
4. Set vendor status to `PAUSED` on `/admin/vendors` to suspend incoming ratings while under investigation.

### Scenario B: Accidental Early Finalization
1. If the event was finalized by mistake:
2. Open `/admin/settings` or update the database record:
   ```sql
   UPDATE "Event" SET status = 'LIVE' WHERE slug = 'grand-food-fest-hyderabad-2026';
   UPDATE "EventDay" SET status = 'LIVE' WHERE "dayNumber" = 1;
   ```
3. Verify `/api/health` reports status `LIVE`.

### Scenario C: Cellular Tower Outage / Connectivity Drop
- Attendees will see the offline banner.
- All rating submissions use client-side `Idempotency-Key` headers. When connectivity returns, retried submissions will not double-count or consume multiple quota slots.

