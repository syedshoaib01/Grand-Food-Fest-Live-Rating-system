# PRE-DEPLOYMENT PRODUCTION CHECKLIST
**Grand Food Fest 2026 — Live Attendee Voting Platform**  
**Target Environment:** Vercel (Serverless Edge) + Supabase PostgreSQL (AWS `ap-south-1`)  
**Date:** September 24, 2026  
**Status:** ✅ PRODUCTION READY FOR VERCEL DEPLOYMENT  

---

## A. ATTENDEE IDENTITY MODEL (ZERO-VERIFICATION V1)

In accordance with festival committee directives, V1 attendee voting operates on a **zero-resistance name model**:
1. **Visitor Entry:** An attendee enters their display name (e.g. "Rahul") on the mobile homepage or tasting ballot.
2. **Cryptographic Random Token:** If no valid session cookie is present, the server generates a cryptographically random unique session token:
   ```typescript
   const randomToken = `ANON-${crypto.randomBytes(12).toString("hex").toUpperCase()}`;
   ```
3. **Session Creation:** The server provisions a unique `AttendeeSession` in Supabase PostgreSQL and signs an HMAC-SHA256 cookie (`gff_session`) containing `sessionId`, `attendeeName`, and 72-hour TTL.
4. **Cookie Reuse:** If an attendee already possesses a valid signed session cookie for the active event day, the server resolves their existing session, updates `lastSeenAt`, and updates their display name metadata without creating duplicate database rows.
5. **No Same-Name Collision:** Two separate visitors both entering "Rahul" receive completely distinct session tokens (`ANON-XXXXX` vs `ANON-YYYYY`), completely independent 5-vendor quotas, and independent ratings.
6. **Zero Friction Preserved:** No OTP, ticket QR scanning, wristband verification, email, phone, or password creation required.

---

## B. NON-NEGOTIABLE VOTING INVARIANTS

1. **Max 5 Stalls/Day:** Strictly enforced inside `prisma.$transaction`. Concurrency is serialized via `tx.attendeeSession.update` row-level write locking.
2. **Same-Day Upsert:** Rating the same stall again updates the rating in-place and consumes **0 extra quota slots**.
3. **Multi-Day Reset:** Each event day provides attendees with a fresh 5-vendor quota.
4. **Food-Only Leaderboard:** Lifestyle vendors (`vendorType: LIFESTYLE`) are strictly rejected from ratings and excluded from leaderboard calculations.
5. **No 5-Star Default:** Newly selected unrated stalls initialize to 0 stars; submission is disabled until explicit 1–5 stars are selected for all stalls.
6. **Server-Side Trust:** Client-provided `sessionId` in request bodies/headers is strictly ignored; session identity is derived exclusively from verified `gff_session` HMAC cookies.
7. **No Plaintext Passwords / Raw Passes:** Admin passwords use PBKDF2 with random 16-byte salt; pass tokens are masked to `ATT-••••-XXXX`.
8. **Truthful Analytics:** Bayesian score calculations and `RankSnapshot` comparisons (`↑`, `↓`, `—`, `NEW`) reflect genuine votes.

---

## C. PRISTINE DATABASE CLEAN-STATE COUNTS

The database was cleaned inside an atomic transaction (`scripts/cleanup-production.ts`) and verified with read-only inspection (`scripts/sanity-check.ts`):

| Model / Table | Count | Production Purpose |
| :--- | :---: | :--- |
| **`Event`** | **1** | Grand Food Fest Hyderabad 2026 |
| **`EventDay`** | **3** | Day 1 (Oct 9), Day 2 (Oct 10), Day 3 (Oct 11) |
| **`Vendor`** | **164** | 124 Competing Food Stalls + 40 Lifestyle Vendors |
| **`Award`** | **5** | Official Category Honors (in `DRAFT` status) |
| **`AwardNominee`** | **0** | Clean ceremony state |
| **`AdminUser`** | **1** | Superadmin Account (`admin@grandfoodfest.com`) |
| **`AttendeeSession`** | **0** | **PRISTINE** (0 test sessions) |
| **`Rating`** | **0** | **PRISTINE** (0 test ratings) |
| **`RankSnapshot`** | **0** | **PRISTINE** (0 test snapshots) |
| **`AnomalyLog`** | **0** | **PRISTINE** (0 test logs) |

---

## D. EVENT STATE

* **Event Status:** `UPCOMING`
* **Day 1 Status:** `UPCOMING` (Date: October 9, 2026)
* **Day 2 Status:** `UPCOMING` (Date: October 10, 2026)
* **Day 3 Status:** `UPCOMING` (Date: October 11, 2026)
* **Transition Mechanism:** When gates open on festival morning, the administrator navigates to `/admin/settings` and selects Day 1 to set to `LIVE`.

---

## E. AUTOMATED TEST SUITE

* **Test Framework:** Vitest against live Supabase PostgreSQL
* **Command:** `npm test`
* **Result:** **9 of 9 test suites passed, 53 of 53 tests passed (100% green)**
  * `src/tests/api-security.test.ts` (4 passed)
  * `src/tests/attendee-identity.test.ts` (6 passed — proving same-name independence, cookie reuse, quota isolation, and UX preservation)
  * `src/tests/audit-improvements.test.ts` (11 passed)
  * `src/tests/concurrency-quota.test.ts` (3 passed — isolated test event & cleanup)
  * `src/tests/hardening-and-security.test.ts` (10 passed)
  * `src/tests/load-simulation.test.ts` (1 passed — 200 concurrent operations, 0 leaks, isolated test event & cleanup)
  * `src/tests/postgres-integration.test.ts` (4 passed — isolated test event & cleanup)
  * `src/tests/vendor-search.test.ts` (4 passed)
  * `src/tests/voting-engine.test.ts` (10 passed)

---

## F. PRODUCTION BUILD RESULT

* **Command:** `NEXT_PUBLIC_DEV_MODE=false npm run build`
* **Result:** **Exit code 0**. 32 of 32 static and dynamic routes compiled with 0 TypeScript errors and 0 lint warnings.

---

## G. VERCEL CONFIGURATION REQUIREMENTS

1. **Framework Preset:** Next.js
2. **Node.js Version:** 20.x
3. **Root Directory:** `./`
4. **Build Command:** `npm run build` (runs `DIRECT_URL="${DIRECT_URL:-$DATABASE_URL}" prisma generate && next build`)
5. **Output Directory:** `.next` (default)
6. **Connection Pooling Recommendation**:
   * For `DATABASE_URL`: Use Supabase **Transaction Pooler** (port `6543`) with `?pgbouncer=true` or pool mode. This ensures serverless lambdas do not exhaust database connections.
   * For `DIRECT_URL`: Use Supabase direct connection (port `5432`) for schema migrations.

---

## H. REQUIRED ENVIRONMENT VARIABLES FOR VERCEL

| Variable | Environment | Required Value / Source |
| :--- | :---: | :--- |
| `DATABASE_URL` | Production | Supabase PostgreSQL Connection Pooler URL (`aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true`) |
| `DIRECT_URL` | Production | Supabase PostgreSQL Direct Connection URL (`aws-0-ap-south-1.pooler.supabase.com:5432/postgres`) |
| `ADMIN_JWT_SECRET` | Production | Cryptographically secure random 32+ character secret string |
| `PASS_SALT` | Production | Cryptographically secure random salt string |
| `ADMIN_EMAIL` | Production | `admin@grandfoodfest.com` |
| `ADMIN_PASSWORD` | Production | Strong password configured during database seed |
| `NEXT_PUBLIC_DEV_MODE` | Production | `"false"` (**MUST BE FALSE** — hides DevBar & demo passes) |
| `NODE_ENV` | Production | `"production"` |

---

## I. KNOWN LIMITATIONS OF ZERO-VERIFICATION V1

1. **Browser / Device Boundary:** Because there are no attendee tickets or wristband credentials required in V1, clearing cookies or switching browsers will issue a new anonymous session. This is an intentional design trade-off prioritizing zero friction outdoors.
2. **Kiosk Surface (`/kiosk`):** Deferred for future updates; mobile smartphone UX is the primary festival surface.
3. **In-Memory Rate Limiting:** Rate limiting uses sliding-window in-memory stores local to lambda instances; sufficient for standard festival traffic spikes.

---

## J. STEP-BY-STEP DEPLOYMENT PROCEDURE

1. **Push Clean Code to GitHub:**
   ```bash
   git push origin main
   ```
2. **Import Project into Vercel Dashboard:**
   * Select `syedshoaib01/Grand-Food-Fest-Live-Rating-system`.
   * Configure all 8 environment variables in Section H.
   * Ensure `NEXT_PUBLIC_DEV_MODE="false"`.
3. **Deploy:**
   * Click **Deploy**.
   * Wait for build logs to confirm `Prisma Client generated` and `Compiled successfully`.
4. **Domain Assignment:**
   * Attach production custom domain (e.g. `vote.grandfoodfest.com`).

---

## K. POST-DEPLOYMENT SMOKE TESTS

1. **Health Diagnostic:**
   * Visit `https://<domain>/api/health` → Verify `database.status: "connected"`, event status `UPCOMING`.
2. **Attendee Flow:**
   * Open `https://<domain>/` on a smartphone.
   * Enter name → Verify immediate entry, header displays name and "5 stamps left".
   * Rate a stall → Confirm submission succeeds, remaining quota shows "4 stamps left".
3. **Admin Panel:**
   * Visit `https://<domain>/admin/login`.
   * Log in with admin credentials → Confirm dashboard, vendor list, and settings load cleanly.
4. **DevBar Absence:**
   * Confirm no top developer bar is visible anywhere on public pages.

---

## L. ROLLBACK CONSIDERATIONS

* **Database Rollback:** The Supabase PostgreSQL database contains no destructive data changes. Migrations are checked in at `prisma/migrations/20260922104355_init/migration.sql`.
* **Deployment Rollback:** In the Vercel dashboard, any previous instant deployment can be redeployed within seconds by clicking **Promote to Production**.
