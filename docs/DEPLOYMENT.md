# DEPLOYMENT SPECIFICATION — GRAND FOOD FEST

This document details the production deployment, environment variables, Supabase PostgreSQL configuration, database migration, and disaster recovery runbooks for **Grand Food Fest 2026** at Gachibowli Stadium, Hyderabad.

---

## 1. PRODUCTION ARCHITECTURE & HOSTING

* **Web Hosting**: Vercel, AWS ECS, Railway, or Render (Node.js 18+ runtime).
* **Authoritative Production Database**: **PostgreSQL hosted by Supabase** (AWS `ap-south-1` Mumbai region).
* **Connection Architecture**:
  * `DATABASE_URL`: Supabase Connection Pooler (`aws-0-[region].pooler.supabase.com:5432` Session mode or `:6543` Transaction mode) with connection limits for serverless / multi-instance web servers.
  * `DIRECT_URL`: Supabase Session Pooler or direct endpoint for Prisma migration execution (`prisma migrate deploy`).
* **CDN / Edge Network**: Cloudflare or Vercel Edge Network for caching static assets and directory pages.

---

## 2. PRODUCTION ENVIRONMENT VARIABLES

Configure these variables in your hosting provider's secrets manager (never commit raw values to version control):

| Variable | Purpose | Production Requirement |
|---|---|---|
| `DATABASE_URL` | Pooled PostgreSQL connection string | `postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres` |
| `DIRECT_URL` | Direct/migration connection string | `postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres` |
| `ADMIN_JWT_SECRET` | Cryptographic HMAC signing secret | 64-character random hex string (`openssl rand -hex 32`) |
| `PASS_SALT` | Attendee pass token hashing salt | 32-character random hex string (`openssl rand -hex 16`) |
| `ADMIN_EMAIL` | Production administrator login email | e.g. `lead-organizer@grandfoodfest.com` |
| `ADMIN_PASSWORD` | Production administrator login password | Strong password (hashed with PBKDF2 into DB during seed) |
| `NEXT_PUBLIC_DEV_MODE` | Developer mode flag | **MUST BE `false` IN PRODUCTION** (disables DevBar & demo passes) |
| `NODE_ENV` | Node environment | `production` (enforces SSL cookie security & JSON logs) |

---

## 3. PRODUCTION DEPLOYMENT RUNBOOK

### Step 1: Install Dependencies
```bash
npm ci
```

### Step 2: Deploy Checked-in Prisma Migrations
```bash
npm run db:migrate
# Executes: npx prisma migrate deploy
```
*Applies `prisma/migrations/20260922104355_init/migration.sql` to Supabase. Never use `prisma db push` in production.*

### Step 3: Bootstrap Production Data
```bash
npm run db:seed:prod
```
*Seeds the official 164 vendors (124 Food, 40 Lifestyle), 3 festival days (Day 1: LIVE), official honors in DRAFT, and creates the admin account. **Zero fake attendee passes, zero fake votes, zero fake snapshots.***

### Step 4: Verify Application Build
```bash
NEXT_PUBLIC_DEV_MODE=false npm run build
```

### Step 5: Verify Live System Health
```bash
curl -s https://your-production-domain.com/api/health
```
Ensure the response confirms:
```json
{
  "status": "ok",
  "database": { "status": "connected", "latencyMs": "<500" },
  "event": { "name": "Grand Food Fest Hyderabad 2026", "status": "LIVE" }
}
```

---

## 4. DATABASE BACKUP & RECOVERY STRATEGY

### 1. Supabase Automated Backups
* **Point-in-Time Recovery (PITR)**: Supabase Pro projects provide continuous WAL archiving and Point-in-Time Recovery up to 7 days, allowing restoration to any specific second before a catastrophic event.
* **Daily Backups**: Automated daily snapshots retained by Supabase. Accessible via Supabase Dashboard -> Project Settings -> Database -> Backups.

### 2. Migration Failure Recovery
* If `npx prisma migrate deploy` fails due to a network interruption or conflict:
  1. Inspect the migration log: `npx prisma migrate status`.
  2. If a migration is marked failed in `_prisma_migrations`, resolve the error and run `npx prisma migrate resolve --rolled-back <migration_name>` or `--applied <migration_name>` as appropriate.
  3. Never run destructive `migrate reset` against the live production Supabase instance.

### 3. Accidental Event Finalization Recovery
* If an administrator accidentally finalizes the festival or closes an active day:
  1. Login to `/admin/settings` and reset the event status to `LIVE`.
  2. Or execute directly via SQL query in Supabase SQL Editor:
     ```sql
     UPDATE "Event" SET status = 'LIVE' WHERE slug = 'grand-food-fest-hyd-2026';
     UPDATE "EventDay" SET status = 'LIVE' WHERE "dayNumber" = 1;
     ```
  3. Verify `/api/health` reports status `LIVE`.

### 4. Database Outage / Failover
* If Supabase pooler becomes temporarily unreachable:
  * Check the Supabase status page (`status.supabase.com`).
  * Ensure the serverless connection limit does not exceed PgBouncer capacity.
  * In an extreme regional AWS outage, Supabase PITR can restore a snapshot to a secondary project in another region.


## 5. HEALTH CHECK & MONITORING

* **Health Check Endpoint**: `GET /api/health`
* Automated uptime monitors should ping `/api/health` every 30 seconds.
* Confirms database connectivity, query latency, and live event state without exposing sensitive connection details.

