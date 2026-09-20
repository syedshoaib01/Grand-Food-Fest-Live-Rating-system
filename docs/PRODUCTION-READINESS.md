# Grand Food Fest — Production Readiness & Deployment Runbook

This guide contains the non-negotiable checklist, infrastructure configuration, and incident runbooks required to deploy Grand Food Fest Live Rating System for live production at Gachibowli Stadium, Hyderabad.

---

## 1. Production Environment Variables Checklist

Before launching, verify all production secrets are generated using high-entropy random sources:

```bash
# Generate 256-bit secrets via openssl
openssl rand -hex 32  # Use for ADMIN_JWT_SECRET
openssl rand -hex 16  # Use for PASS_SALT
```

| Variable | Requirement | Example / Guidance |
|---|---|---|
| `NODE_ENV` | `production` | Enables cookie `secure: true`, JSON structured logs |
| `DATABASE_URL` | PostgreSQL URI | `postgresql://user:pass@host:5432/grandfoodfest?schema=public&connection_limit=50` |
| `ADMIN_JWT_SECRET` | 64-char hex string | Random cryptographically secure 256-bit key |
| `PASS_SALT` | 32-char hex string | Random cryptographically secure salt |
| `NEXT_PUBLIC_DEV_MODE` | `false` | Disables demo pass switcher, dev bar, debug controls |
| `ADMIN_EMAIL` | Production admin email | e.g. `lead-organizer@grandfoodfest.com` |
| `ADMIN_PASSWORD` | Strong password | Min 16 characters (seed creates hashed record in DB) |

> [!CAUTION]
> If `ADMIN_JWT_SECRET` contains `gff-secret-jwt-key` or `PASS_SALT` contains `gff-salt-2026`, the system will log a critical security notice. Never launch with default keys.

---

## 2. PostgreSQL Migration & Database Provisioning

SQLite is designed for local development only. For the 75,000 attendee event, use PostgreSQL (e.g. AWS RDS, Neon, Supabase, or Railway).

### Step-by-Step Migration:
1. **Swap Schema to PostgreSQL**:
   ```bash
   cp prisma/schema.postgresql.prisma prisma/schema.prisma
   ```
2. **Configure Database Connection**:
   Update `DATABASE_URL` in `.env` or deployment secrets to your PostgreSQL connection string.
3. **Push Schema & Indices**:
   ```bash
   npx prisma db push
   ```
4. **Seed Vendors and Initial Event Configuration**:
   ```bash
   npm run db:seed
   ```
5. **Verify Database Connectivity**:
   ```bash
   curl -s https://your-domain.com/api/health
   ```
   Ensure `{"database": {"status": "connected"}}` is returned.

---

## 3. Concurrency & Connection Pool Tuning

With thousands of attendees rating food stalls concurrently:

- **Prisma Connection Pooling**: Append `?connection_limit=40&pool_timeout=15` to `DATABASE_URL`.
- **Row-Level Serialization**: Quota transactions lock the attendee's session row, preventing race conditions even when thousands of attendees vote simultaneously across different stalls.
- **SQL Aggregations**: Bayesian leaderboard calculations use SQL `COUNT` and `SUM` groupings, loading only ~160 vendor summaries instead of hundreds of thousands of individual rating records.

---

## 4. CDN & Caching Rules (Cloudflare / Vercel Edge)

- **Static Assets (`/_next/static/*`, `/images/*`, `/fonts/*`)**:
  - Cache-Control: `public, max-age=31536000, immutable`
- **Leaderboard API (`/api/leaderboard`, `/api/trending`)**:
  - Cache-Control: `public, s-maxage=5, stale-while-revalidate=10`
  - Prevents database thrashing during viral vote spikes while keeping ranks fresh within seconds.
- **Voting Endpoints (`/api/voting/*`, `/api/admin/*`)**:
  - Cache-Control: `private, no-cache, no-store, must-revalidate`
  - Must never be cached by edge CDNs.

---

## 5. Monitoring & Health Checks

- **Health Endpoint**: `GET /api/health`
  - Automated ping every 30 seconds by UptimeRobot / Datadog.
  - Alerts if latency exceeds 500ms or status is non-200.
- **Anomaly Detection**:
  - Admin dashboard automatically scans `/admin/anomalies` for velocity spikes (>20 ratings/10 min) or rating clusters.
- **Structured Logs**:
  - Formatted as single-line JSON in production, easily ingested by Logtail, Datadog, CloudWatch, or Grafana Loki.

---

## 6. Emergency Runbook: Incident Responses

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
   UPDATE "EventDay" SET status = 'LIVE' WHERE "dayNumber" = 2;
   ```
3. Verify `/api/health` reports status `LIVE`.

### Scenario C: Cellular Tower Outage / Connectivity Drop
- Attendees will see the offline banner.
- All rating submissions use client-side `Idempotency-Key` headers. When connectivity returns, retried submissions will not double-count or consume multiple quota slots.
