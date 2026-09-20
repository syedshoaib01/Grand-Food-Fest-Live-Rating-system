# GRAND FOOD FEST — SYSTEM CONTEXT & AI AGENT HANDOVER GUIDE

> **MANDATORY NOTICE FOR FUTURE AI CODING AGENTS**:  
> Read this document first before making changes. This file is the primary handover architecture guide for `Grand-Food-Fest-Live-Rating-system`.

---

## 1. PROJECT OVERVIEW

The **Grand Food Fest Live Rating System** is a real-time festival evaluation platform built for **Grand Food Fest 2026** at Gachibowli Stadium, Hyderabad (October 9–11, 2026).

The platform allows thousands of festival attendees to:
1. Identify themselves using their physical wristband or ticket token (e.g., `PASS-000001`).
2. Discover 160+ food stalls across stadium zones.
3. Rate up to **5 distinct food stalls per event day** on a 1–5 star scale.
4. Watch a real-time Top 10 leaderboard powered by confidence-adjusted scoring and truthful rank history.
5. Track trending stalls and explore official festival honors (awards).

---

## 2. PLATFORM PRIORITY: MOBILE-FIRST

> **The public consumer experience is mobile-first and optimized primarily for smartphones.**

Festival attendees use this app while outdoors, walking through crowded stadium food zones, holding food or drinks in one hand, under bright sunlight and fluctuating mobile connectivity.

**Key mobile requirements:**
* Target viewports: 360×800, 375×812, 390×844, 393×873, 412×915, 430×932.
* Thumb-friendly interactions: critical controls within comfortable bottom/middle thumb reach.
* High touch targets: minimum 44×44px for rating stars and action buttons.
* Bottom navigation bar (`Top 10`, `Explore`, `Rate`, `Awards`).
* Warm, accessible festival aesthetic: cream background (`#FAF8F5`), crisp white cards (`#FFFFFF`), charcoal text (`#1C1917`), saffron/amber accents (`#D97706` / `#F59E0B`), warm orange (`#EA580C`).
* Never treat mobile as a shrunken desktop. Mobile is the canonical starting point.
* **Kiosk scope is explicitly deferred**: The `/kiosk` route exists and remains operational, but do not prioritize kiosk hardware redesign or let kiosk assumptions compromise the mobile UX.

---

## 3. CORE PRODUCT RULES & INVARIANTS

| Rule | Specification |
| :--- | :--- |
| **Rating Scale** | 1 to 5 stars (integer). |
| **Daily Limit** | Maximum **5 distinct food vendors** per attendee session per event day. |
| **Same-Day Updates** | Rating the same vendor on the same day updates the existing rating in-place without consuming an additional quota slot. |
| **Multi-Day Quota** | Quota resets every festival day (Day 1: 5 stalls, Day 2: 5 stalls, Day 3: 5 stalls). |
| **Eligibility** | Food vendors only (`vendorType: FOOD`). Lifestyle stalls cannot be rated or enter the leaderboard. |
| **Leaderboard Threshold**| Minimum **20 verified ratings** to enter the official Top 10. |
| **Scoring Algorithm** | Confidence-adjusted Bayesian score: $S = \frac{v}{v + m} \cdot R + \frac{m}{v + m} \cdot C$. |
| **Tie-Breaking** | Ties are broken by `ratingCount` descending, then `ratingAverage` descending. If identical, vendors share the rank. |
| **Rank Movement** | Must be truthful from `RankSnapshot` history (`↑ X`, `↓ Y`, `—`, `NEW`). Never simulate fake movement. |
| **Rating Default** | Newly selected stalls must initialize to **0 stars** (`no rating selected`). Never default to 5 stars. |
| **Session Trust** | The server determines attendee identity strictly from signed HMAC session cookies (`gff_session`). Never trust client-supplied session IDs in request bodies or headers. |
| **Data Privacy** | Raw production pass tokens are never exposed in UI, admin views, or exports; they are anonymized as `ATT-••••-XXXX`. |
| **Admin Security** | Every `/api/admin/*` endpoint is guarded server-side by `requireAdmin()`. Passwords use salted PBKDF2/Argon2. |

---

## 4. ARCHITECTURE & TECHNOLOGY STACK

```text
Next.js 14 (App Router) + React 18
├── Frontend: Tailwind CSS (Custom warm festival theme) + Lucide React + Google Inter font
├── Backend APIs: Next.js Route Handlers (Edge & Node runtime compatible)
├── Data Layer: Prisma ORM v5.22.0
├── Database: SQLite (local development) / PostgreSQL (production target)
├── Auth / Security: Cryptographic HMAC tokens (SHA-256), PBKDF2 salted password hashing
└── Testing: Vitest (Unit & Integration tests)
```

### Core Domain Services (`src/lib/`)
* [auth.ts](file:///home/shoaib/projects/my_projects/Grand-Food-Fest-Live-Rating-system/src/lib/auth.ts): Token signing, verification, password hashing, `requireAdmin()` server gate, and `anonymizePassToken()`.
* [ranking-engine.ts](file:///home/shoaib/projects/my_projects/Grand-Food-Fest-Live-Rating-system/src/lib/ranking-engine.ts): Bayesian scoring, tie handling, threshold enforcement, `RankSnapshot` comparison for truthful trend tracking, and snapshot persistence.
* [trending-engine.ts](file:///home/shoaib/projects/my_projects/Grand-Food-Fest-Live-Rating-system/src/lib/trending-engine.ts): Real rating velocity aggregation over a rolling 30-minute window (`+X ratings in 30 min`).
* [voting-engine.ts](file:///home/shoaib/projects/my_projects/Grand-Food-Fest-Live-Rating-system/src/lib/voting-engine.ts): Pass normalization, anonymous attendee session creation, quota checking, atomic rating upserts, and session status retrieval.
* [anomaly-engine.ts](file:///home/shoaib/projects/my_projects/Grand-Food-Fest-Live-Rating-system/src/lib/anomaly-engine.ts): Velocity spike detection and admin rating invalidation audit trails.
* [SessionContext.tsx](file:///home/shoaib/projects/my_projects/Grand-Food-Fest-Live-Rating-system/src/lib/SessionContext.tsx): Client-side React context for attendee session state and daily quota tracking.

---

## 5. DATABASE SCHEMA (`prisma/schema.prisma`)

```prisma
model Event {
  id                           String         @id @default(uuid())
  name                         String
  slug                         String         @unique
  startDate                    DateTime
  endDate                      DateTime
  status                       String         @default("UPCOMING") // UPCOMING, LIVE, CLOSING, FINALIZED
  ratingLimitPerAttendeePerDay Int            @default(5)
  minimumRatingsForLeaderboard Int            @default(20)
  days                         EventDay[]
  vendors                      Vendor[]
  sessions                     AttendeeSession[]
  ratings                      Rating[]
  awards                       Award[]
  rankSnapshots                RankSnapshot[]
}

model EventDay {
  id        String   @id @default(uuid())
  eventId   String
  dayNumber Int      // 1, 2, 3
  date      DateTime
  status    String   @default("UPCOMING") // UPCOMING, LIVE, CLOSED
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
}

model Vendor {
  id           String         @id @default(uuid())
  eventId      String
  name         String
  slug         String
  description  String?
  category     String
  cuisine      String?
  stallNumber  String
  vendorType   String         @default("FOOD") // FOOD, LIFESTYLE
  status       String         @default("ACTIVE") // ACTIVE, PAUSED, CLOSED
  ratings      Rating[]
  awardsWon    Award[]
  nominees     AwardNominee[]
  rankSnapshots RankSnapshot[]
}

model AttendeeSession {
  id         String    @id @default(uuid())
  eventId    String
  eventDayId String
  passHash   String
  passToken  String
  lastSeenAt DateTime  @default(now())
  ratings    Rating[]

  @@unique([passHash, eventDayId])
}

model Rating {
  id                String          @id @default(uuid())
  eventId           String
  eventDayId        String
  attendeeSessionId String
  vendorId          String
  rating            Int             // 1 to 5
  isValid           Boolean         @default(true)
  idempotencyKey    String?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  @@unique([attendeeSessionId, vendorId, eventDayId])
}

model RankSnapshot {
  id           String   @id @default(uuid())
  eventId      String
  vendorId     String
  rank         Int
  score        Float
  ratingsCount Int
  snapshotAt   DateTime @default(now())

  @@index([eventId, snapshotAt])
  @@index([vendorId, snapshotAt])
}
```

---

## 6. API MAP

### Public Consumer APIs
* `GET /api/event`: Active festival event, active event day status.
* `GET /api/leaderboard`: Real-time Top 10 food leaderboard + all ranked stalls.
* `GET /api/trending?window=30&limit=6`: Stalls with highest rating velocity in the last 30 minutes.
* `GET /api/vendors`: Paginated vendor directory with category and search filters.
* `GET /api/vendors/[id]`: Single vendor profile, rating distribution (5★ to 1★), rank, and nominations.
* `GET /api/awards`: Revealed nominees and announced winners.
* `POST /api/voting/verify`: Verifies attendee pass token, creates anonymous session, sets `gff_session` cookie.
* `GET /api/voting/session`: Returns attendee quota, rated stalls today, and remaining votes.
* `POST /api/voting/ratings`: Submits 1–5 star ratings. Strictly requires verified session.

### Protected Admin APIs (Require `requireAdmin()`)
* `POST /api/admin/auth`: Admin login with PBKDF2 password verification, sets `gff_admin` cookie.
* `GET /api/admin/auth`: Checks admin session status.
* `DELETE /api/admin/auth`: Admin logout.
* `GET /api/admin/analytics`: Real-time telemetry, total ratings, active attendees, hourly velocity.
* `GET /api/admin/settings`: Festival status, active event day, and threshold configuration.
* `PUT /api/admin/settings`: Updates festival settings, switches active day, or finalizes event.
* `GET /api/admin/ratings`: Paginated rating log with anonymized pass tokens (`ATT-••••-XXXX`).
* `PATCH /api/admin/ratings`: Invalidate or restore individual rating records.
* `GET /api/admin/anomalies`: Scan and view flagged velocity spikes and suspicious voting clusters.
* `POST /api/admin/anomalies`: Resolve or invalidate suspicious rating batches.
* `POST /api/admin/awards`: Create awards, reveal nominees, or finalize winners.
* `GET /api/admin/exports/[type]`: Exports CSV or JSON for `leaderboard`, `vendors`, `ratings`, or `summary` (with pass tokens anonymized).
* `POST /api/vendors`: Create new vendor.
* `PUT/PATCH /api/vendors/[id]`: Update vendor profile or pause/close stall.

---

## 7. LAYOUT ARCHITECTURE & GLOBAL STACKING SYSTEM

The application shell establishes a strict vertical and stacking architecture:

### Global Z-Index Hierarchy
```text
page/content       z-content   (0)   Default document flow, cards, text
sticky content     z-sticky    (10)  In-page sub-navigation, category filter bars
bottom navigation  z-bottomNav (20)  Fixed mobile bottom tab bar (BottomNav.tsx, h-14, pb-safe)
global header      z-header    (30)  Sticky festival navbar (Navbar.tsx, h-14) & admin top bar
dev tools          z-devTools  (40)  Developer toolbar (DevBar.tsx, document flow)
drawer backdrop    z-backdrop  (50)  Dimmed overlay (bg-black/80 backdrop-blur-xs)
drawer             z-drawer    (60)  Slide-in navigation drawer (AdminLayout, solid opaque #1C1917)
modal              z-modal     (70)  Interactive modal dialogs (create/edit stall, awards)
toast              z-toast     (80)  Floating transient alerts and notifications
```

### Layout Stacking Invariants:
1. **DevBar & Header Isolation**: `DevBar` is rendered in normal document flow above `Navbar`. When scrolling, `DevBar` scrolls off naturally while `Navbar` (`sticky top-0 z-header: 30`) sticks cleanly with zero overlap. Expanding `DevBar` pushes `Navbar` down naturally by reserving actual layout space.
2. **Admin Mobile Drawer**: Operates as a true off-canvas drawer (`z-drawer: 60`, `w-[85%] max-w-xs`, solid opaque `bg-[#1C1917]`) over a dimmed backdrop (`z-backdrop: 50`). Underlying content cannot bleed through. Body scroll is locked when open. On desktop, it renders as a persistent `w-64` sidebar.
3. **Zero Horizontal Overflow**: The root layout enforces `overflow-x-hidden w-full max-w-full` on `body` and `main`. All horizontal scroll components (e.g. category chips) must be contained in bounded wrappers (`overflow-x-auto no-scrollbar w-full`).
4. **Theme Defaults**: Public consumer UI defaults to Light (`#FAF8F5` cream with `#FFFFFF` surfaces and `#1C1917` text); Admin defaults to Dark (`#121110` with `#1C1917` cards).

---

## 8. ENVIRONMENT VARIABLES

| Variable Name | Purpose | Production Requirement |
| :--- | :--- | :--- |
| `DATABASE_URL` | Database connection string | PostgreSQL connection string with SSL |
| `ADMIN_JWT_SECRET` | Secret key for signing HMAC session tokens | 32-byte cryptographically secure random string |
| `PASS_SALT` | Salt used to hash attendee passes | 16-byte cryptographically secure random string |
| `ADMIN_EMAIL` | Fallback admin email (dev only) | Admin accounts managed in database |
| `ADMIN_PASSWORD` | Fallback admin password (dev only) | Never use default `admin123` in production |
| `NEXT_PUBLIC_DEV_MODE` | Controls DevBar and demo passes in UI | Must be set to `"false"` in production |

---

## 9. LOCAL SETUP & COMMANDS

```bash
# 1. Install dependencies
npm install

# 2. Synchronize database schema
npx prisma db push

# 3. Seed database with 160+ vendors, 400 sessions, ratings, and historical snapshots
npm run db:seed

# 4. Run automated test suite
npm test

# 5. Start development server
npm run dev

# 6. Verify production build
npm run build
```

---

## 10. AI INSTRUCTIONS (HANDOVER CHECKLIST)

When continuing work on this repository:
1. **Read `context.md` first.**
2. **Preserve all business invariants** (never allow >5 stalls/day, never trust client-supplied session IDs, never default new ratings to 5 stars).
3. **Never weaken server-side validation** in `/api/admin/*` or `/api/voting/*`.
4. **Adhere to the global z-index system** (`z-content: 0` to `z-toast: 80`). Never use arbitrary `z-*` values.
5. **Never make DevBar and Navbar siblings with sticky top-0**; keep DevBar in normal flow above Navbar.
6. **Keep admin drawer solid and opaque** (`bg-[#1C1917]`) at `z-drawer: 60` with `z-backdrop: 50`.
7. **Keep the public consumer experience mobile-first**, thumb-friendly, and warm festival themed.
8. **Never invent fake metrics**: rank movement and trending must come from actual data (`RankSnapshot` and rolling activity).
9. **Lock session rows during quota transactions** to prevent concurrent over-voting.
10. **Run `npm test`** after any business logic change.
11. **Run `npm run build`** after major architectural updates.
12. **Consult key documentation**:
    - [FIRST-PRINCIPLES.md](file:///home/shoaib/projects/my_projects/Grand-Food-Fest-Live-Rating-system/docs/FIRST-PRINCIPLES.md): Real-world festival constraints & mathematical foundations.
    - [AUDIT.md](file:///home/shoaib/projects/my_projects/Grand-Food-Fest-Live-Rating-system/docs/AUDIT.md): Comprehensive system audit & vulnerability review.
    - [IMPROVEMENT-PLAN.md](file:///home/shoaib/projects/my_projects/Grand-Food-Fest-Live-Rating-system/docs/IMPROVEMENT-PLAN.md): Prioritized improvements and status.
    - [OPEN-QUESTIONS.md](file:///home/shoaib/projects/my_projects/Grand-Food-Fest-Live-Rating-system/docs/OPEN-QUESTIONS.md): 8 key organizer decisions and trade-offs.
    - [PRODUCTION-READINESS.md](file:///home/shoaib/projects/my_projects/Grand-Food-Fest-Live-Rating-system/docs/PRODUCTION-READINESS.md): Production checklist, PostgreSQL migration, & runbooks.

