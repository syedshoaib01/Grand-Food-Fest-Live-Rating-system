# 🎪 Grand Food Fest — Live Food Rating Platform (Hyderabad 2026)

> A production-grade, real-time live food-rating platform built for **Grand Food Fest Hyderabad** (Gachibowli Stadium, October 9–11, 2026). Engineered for 75,000+ attendees and hundreds of thousands of rating records with near-zero friction, strict multi-day quota enforcement, confidence-adjusted Bayesian ranking, touch-friendly kiosks, and full administrative oversight.

---

## 🌟 Key Capabilities

- **Zero-Friction Voter Identity**: Anonymous ticket pass verification (`PASS-000001` through `PASS-000150`) with SHA-256 salting. No passwords, emails, OTPs, or PII.
- **Strict Voting Business Engine**:
  - Attendees can rate **1 to 5 distinct food stalls per event day**.
  - **Rule**: `One attendee + One vendor + One event day = One active rating`.
  - Re-rating the same stall on the same day updates the existing rating (upsert).
  - Attempting a 6th vendor is rejected by the server.
  - Multi-day freshness: Each new event day provides a fresh quota of 5 ratings.
- **Bayesian Confidence Leaderboard**:
  - Uses Bayesian mean adjustment ($\text{Score} = \frac{v}{v + m} R + \frac{m}{v + m} C$) to prevent low-sample vendors (e.g. 2 votes of 5.0) from unfairly dominating high-volume crowd favorites.
  - Configurable minimum rating threshold ($m = 20$).
  - 15–30s real-time polling updates with rank change velocity (`↑ 2`, `↓ 1`, `—`).
- **🔥 Trending Now**: Surfaces vendors with rapid vote velocity over a rolling 30–60 minute window.
- **Venue Exit Kiosk Wizard (`/kiosk`)**: Fullscreen, high-contrast, large-button touch flow with automatic 12-second inactivity reset.
- **Oscars-Style Awards Experience (`/awards`)**: Distinct from the live leaderboard; configurable categories, official nominees, and dramatic winner reveal crowns.
- **Comprehensive Admin Suite (`/admin`)**:
  - Live Telemetry Dashboard (sessions, ratings/hour, fastest rising, most rated).
  - Vendor Management (CRUD, stall assignments, cuisines, status toggles).
  - Ratings Telemetry Inspector (searchable log with soft invalidation controls).
  - Anomaly Detection (velocity spike monitor with one-click invalidation audit trail).
  - Leaderboard Controls (event day switcher, freeze/finalize controls, threshold tuning).
  - Data Exports (instant CSV & JSON downloads for Leaderboard, Vendors, Ratings, and Summary).
- **Developer Mode Switcher**: Built-in top bar to test sample passes (`PASS-000001` to `PASS-000010`) and switch between Day 1, Day 2, and Day 3 in one click.

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v18.17+ or v20+
- **npm**: 10+

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/syedshoaib01/Grand-Food-Fest-Live-Rating-system.git
cd Grand-Food-Fest-Live-Rating-system
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default local variables:
```env
DATABASE_URL="file:./dev.db"
ADMIN_EMAIL="admin@grandfoodfest.com"
ADMIN_PASSWORD="admin123"
ADMIN_JWT_SECRET="gff-secret-jwt-key-hyderabad-2026-very-secure"
PASS_SALT="gff-salt-2026-hyderabad"
NEXT_PUBLIC_DEV_MODE="true"
```

### 4. Database Setup & Seeding
Initialize SQLite database schema and seed ~150 vendors and 1,800+ authentic ratings:
```bash
# Push Prisma schema to SQLite
npm run db:push

# Seed festival data (124 food vendors, 40 lifestyle stalls, 400 attendee sessions, 1800+ ratings)
npm run db:seed
```

### 5. Start the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Credentials & Test Tokens

### Organizer Admin Console
- **URL**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Email**: `admin@grandfoodfest.com`
- **Password**: `admin123`

### Sample Attendee Pass Tokens
You can use any of the following tokens in the voting portal or venue kiosk:
- `PASS-000001`
- `PASS-000002`
- `PASS-000003`
- `PASS-000004`
- `PASS-000005`
*(Or click any token in the top Developer Mode bar)*

---

## 🧪 Automated Testing

Run the Vitest automated test suite:
```bash
npm test
```
Tests cover:
1. Valid 1–5 star rating submissions and persistence.
2. Out-of-bounds rating rejection (e.g. 0 or 6 stars).
3. Same-day rating replacement / upsert without duplicating.
4. Maximum 5 vendors per day enforcement and rejection of 6th vendor.
5. Multi-day quota refresh on different festival days.
6. Lifestyle vendor rating exclusion.
7. Inactive / paused vendor rating rejection.
8. Bayesian score formula accuracy against sample distributions.
9. Cryptographic HMAC token signing & tamper rejection.
10. Anonymous SHA-256 pass hash verification.

---

## 📁 Project Architecture & Routes

```
├── docs/
│   ├── architecture.md    # System design & scaling considerations
│   ├── database.md        # Relational schema, indexes & Postgres migration
│   ├── api.md             # REST API endpoint specifications
│   ├── deployment.md      # Vercel & Docker deployment guides
│   └── admin-guide.md     # Festival organizer operations manual
├── prisma/
│   ├── schema.prisma      # Prisma schema with relational models & indexes
│   └── seed.ts            # Seeder: 150 vendors, 400 sessions, 1800+ ratings
├── src/
│   ├── app/
│   │   ├── page.tsx             # Public homepage with live Top 10 preview & trending
│   │   ├── leaderboard/page.tsx # Live Top 10 with 20s auto-refresh
│   │   ├── vendors/page.tsx     # 150+ stalls directory with category & cuisine filters
│   │   ├── vendors/[slug]/page  # Vendor profile with 5★-to-1★ rating breakdown
│   │   ├── vote/page.tsx        # Mobile voting flow (pass verify -> select -> rate)
│   │   ├── kiosk/page.tsx       # Venue exit fullscreen touch kiosk wizard
│   │   ├── awards/page.tsx      # Oscars-style festival awards ceremony
│   │   └── admin/               # Organizer administration console
│   ├── components/              # Tactile StarRating, LeaderboardTable, DevBar, etc.
│   ├── lib/                     # VotingEngine, RankingEngine, TrendingEngine, AnomalyEngine
│   └── tests/                   # Vitest unit & integration test suites
```

---

## 🚀 Production Deployment

To deploy to production using Supabase / PostgreSQL:
1. Update `prisma/schema.prisma` datasource to `provider = "postgresql"`.
2. Provide your hosted PostgreSQL `DATABASE_URL` in environment variables.
3. Set `NEXT_PUBLIC_DEV_MODE="false"`.
4. Run `npx prisma db push && npm run db:seed`.
5. Deploy to Vercel or Docker (see [docs/deployment.md](docs/deployment.md) for full instructions).
