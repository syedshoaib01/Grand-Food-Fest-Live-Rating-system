# 🎪 Grand Food Fest — Live Food Rating Platform (Hyderabad 2026)

> A hardened, real-time live food-rating platform built for **Grand Food Fest Hyderabad** (Gachibowli Stadium, October 9–11, 2026). Engineered for 75,000+ attendees and hundreds of thousands of rating records with a **mobile-first public experience**, strict multi-day quota enforcement, confidence-adjusted Bayesian ranking, truthful live telemetry, and server-side administrative security.

---

## 📱 Primary Platform Priority: Mobile-First Consumer Experience

The primary public consumer experience is built from the ground up for smartphones held by festival attendees walking through food courts, standing in lines, or holding plates with one hand:
* **Target Viewports**: 360×800, 375×812, 390×844, 393×873, 412×915, 430×932.
* **Ergonomics**: Thumb-accessible bottom navigation (`Top 10`, `Explore`, `Rate`, `Awards`), 44×44px+ touch targets, single-column scanning hierarchy, no horizontal overflows, and safe-area inset protection.
* **Aesthetics**: Warm festival palette (warm cream `#FAF8F5`, white surface cards, charcoal `#1C1917` typography, saffron/amber `#D97706` and warm orange `#EA580C` accents) with Inter typography.
* **Kiosk Scope**: Operational at `/kiosk` with full-screen layout, but intentionally treated as future scope to keep mobile as the canonical design anchor.

---

## 🌟 Core Features & Hardened Architecture

### 1. Zero-Friction Anonymous Identity & Voter Security
- **Identity Model**: Anonymous ticket pass verification (`PASS-000001` through `PASS-000150` in dev; ticket provider token in prod). No passwords, emails, OTPs, or PII.
- **Session Integrity**: Server-side HMAC-SHA256 session cookies (`gff_session`). Session identity is never trusted from arbitrary request bodies or headers.
- **Privacy Masking**: Admin views, ratings logs, and export files never expose raw production passes; they display anonymized tokens (e.g. `ATT-••••-3F91`).

### 2. Strict Voting Rules (Zero-Default Rating)
- **Daily Limit**: Attendees can rate up to **5 distinct food stalls per event day**.
- **Same-Day Upsert**: Rating the same stall again on the same day updates the previous rating without consuming extra quota.
- **Multi-Day Reset**: Fresh 5-vendor quota on each festival day (Day 1, Day 2, Day 3).
- **Eligibility**: Lifestyle/retail vendors cannot receive food ratings; paused/inactive stalls are rejected.
- **Zero-Default Bug Fix**: Unrated vendors initialize with **0 stars selected (`☆ ☆ ☆ ☆ ☆`)**; submissions are strictly disabled until an explicit 1–5 star rating is chosen.

### 3. Truthful Live Ranking & Velocity Engine
- **Bayesian Confidence Adjustment**: Prevents stalls with 2 ratings of 5.0 from overshadowing high-volume favorites ($R_{adj} = \frac{v}{v+m}R + \frac{m}{v+m}C$ where $m = 20$).
- **Truthful Rank Movement**: Compares current ranking against real `RankSnapshot` historical records. Shows verified `↑ X`, `↓ Y`, `—`, or `NEW` indicators (zero simulated movement).
- **Truthful Trending**: Calculates rolling 30-minute rating velocity (`+X ratings in 30 min`) and recent averages based strictly on active database timestamps.
- **Public Language**: Clean, jargon-free labels (`Live ranking based on attendee ratings` instead of statistical jargon).

### 4. Enterprise-Grade Admin Security
- **Server-Side Authorization**: Every `/api/admin/*` endpoint enforces `requireAdmin(req)`. Unauthenticated or tampered requests return `401 Unauthorized`; non-admin roles return `403 Forbidden`.
- **Cryptographic Password Hashing**: PBKDF2 with unique 16-byte cryptographically secure salts (100,000 iterations, SHA-512). No plaintext passwords or hardcoded defaults in production.
- **Event Lifecycle Controls**: Server-side event state management (`UPCOMING`, `LIVE`, `CLOSING`, `FINALIZED`). Voting is automatically rejected once an event is finalized.
- **Awards Ceremony (`/awards`)**: Distinct from the live leaderboard; supports nominee tracking and official winner finalization.

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v18.17+ or v20+
- **npm**: v10+

### 2. Installation
```bash
git clone https://github.com/syedshoaib01/Grand-Food-Fest-Live-Rating-system.git
cd Grand-Food-Fest-Live-Rating-system
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default local development environment:
```env
DATABASE_URL="file:./dev.db"
ADMIN_EMAIL="admin@grandfoodfest.com"
ADMIN_PASSWORD="admin123"
ADMIN_JWT_SECRET="dev-jwt-secret-do-not-use-in-production"
PASS_SALT="dev-pass-salt-do-not-use-in-production"
NEXT_PUBLIC_DEV_MODE="true"
```

### 4. Database Setup & Seeding
```bash
# Push Prisma schema to SQLite (creates tables and RankSnapshot model)
npm run db:push

# Seed festival data (124 food vendors, 40 lifestyle stalls, 400 attendee sessions, 1800+ ratings, baseline snapshots)
npm run db:seed
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) on your mobile browser or emulator.

---

## 🔑 Demo Credentials & Test Tokens

> **Note**: For development and testing only. Production environments require configured secrets and external ticket provider tokens.

### Organizer Admin Console
- **URL**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Email**: `admin@grandfoodfest.com`
- **Password**: `admin123`

### Sample Attendee Pass Tokens
Test tokens for the voting portal or venue kiosk:
- `PASS-000001`
- `PASS-000002`
- `PASS-000003`
- `PASS-000004`
- `PASS-000005`
*(Or click any token in the top Developer Mode bar when `NEXT_PUBLIC_DEV_MODE="true"`)*

---

## 🧪 Automated Testing

Run the automated test suite powered by Vitest:
```bash
npm test
```

### Test Coverage (24 / 24 Passing)
1. **API & Admin Security**:
   - Unauthorized access blocked across `/api/admin/analytics`, `/api/admin/settings`, `/api/admin/ratings`, `/api/admin/anomalies`, `/api/admin/awards`, `/api/admin/exports/csv`.
   - Tampered HMAC cookies and forged attendee session IDs rejected (`401 Unauthorized`).
   - PBKDF2 password hashing verification and rejection of invalid credentials.
   - Anonymized pass token masking (`ATT-••••-XXXX`).
2. **Voting Engine Invariants**:
   - Explicit 1-star through 5-star validation.
   - Rejection of 0-star, 6-star, or non-integer ratings.
   - Rejection of unrated/empty vendor selections.
   - Atomic upsert on same-day re-voting (score updates without consuming extra quota).
   - Rejection of 6th vendor vote on the same day.
   - Quota refresh across multi-day event transitions (Day 1 -> Day 2).
   - Rejection of votes for lifestyle vendors and paused/inactive stalls.
3. **Truthful Ranking & Snapshot Movement**:
   - Minimum rating threshold ($m = 20$) correctly gating Bayesian qualification.
   - Historical `RankSnapshot` comparison correctly computing `↑ X`, `↓ Y`, `—`, and `NEW`.
4. **Event Lifecycle Controls**:
   - Vote rejection when event is in `FINALIZED` state.

---

## 📚 Comprehensive Documentation Suite

| Document | Description |
| :--- | :--- |
| **[context.md](context.md)** | **AI Coding Agent Handover Guide**: Comprehensive system overview, invariants, and architecture rules for future agents. |
| **[AGENTS.md](AGENTS.md)** | **AI Quick Reference**: Quick cheat sheet of rules, invariants, dangerous files, and commands. |
| **[docs/AUDIT.md](docs/AUDIT.md)** | Full security, architectural, and UX audit of the codebase with remediation roadmap. |
| **[docs/PRODUCT.md](docs/PRODUCT.md)** | Product vision, target audience, core loop, and scope boundaries. |
| **[docs/USER-FLOWS.md](docs/USER-FLOWS.md)** | End-to-end user journeys (Discovery, 5-step Voting, Leaderboard scanning, Awards, Admin). |
| **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** | Technical stack, layer separation, data flow, scaling strategy, and real-time design. |
| **[docs/DATABASE.md](docs/DATABASE.md)** | Prisma relational schema, models, compound indexes, and PostgreSQL migration guide. |
| **[docs/API.md](docs/API.md)** | Complete REST API endpoint documentation with schemas, auth requirements, and status codes. |
| **[docs/SECURITY.md](docs/SECURITY.md)** | Threat model, defense-in-depth, PBKDF2 hashing, HMAC sessions, and admin protection. |
| **[docs/AUTHENTICATION.md](docs/AUTHENTICATION.md)** | Detailed breakdown of admin JWT vs. anonymous attendee session architecture. |
| **[docs/VOTING-RULES.md](docs/VOTING-RULES.md)** | Definitive specification of all voting business logic, quotas, upserts, and invariants. |
| **[docs/RANKING.md](docs/RANKING.md)** | Bayesian ranking formulation, threshold rules, tie breaking, and snapshot history. |
| **[docs/TRENDING.md](docs/TRENDING.md)** | Rolling 30-minute velocity formula, calculation methodology, and data guarantees. |
| **[docs/ANALYTICS.md](docs/ANALYTICS.md)** | Live telemetry definitions, aggregate metrics, and data integrity guarantees. |
| **[docs/ADMIN-GUIDE.md](docs/ADMIN-GUIDE.md)** | Operational manual for festival organizers managing vendors, anomalies, and awards. |
| **[docs/EVENT-DAY-RUNBOOK.md](docs/EVENT-DAY-RUNBOOK.md)** | Step-by-step festival operations runbook from pre-gates opening to post-event sign-off. |
| **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** | Production deployment guide for Vercel, Supabase (PostgreSQL), Docker, and secrets. |
| **[docs/TESTING.md](docs/TESTING.md)** | Automated test suites, test cases, execution commands, and edge-case validation. |
| **[docs/UI-QA.md](docs/UI-QA.md)** | Mobile viewport responsive audit, accessibility (WCAG AA), and touch target checklist. |
| **[docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md)** | Mobile-first design tokens: Inter typography scale, warm festival palette, spacing, and components. |
| **[docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** | Common operational issues, database lock resolutions, and emergency procedures. |
| **[docs/ASSUMPTIONS.md](docs/ASSUMPTIONS.md)** | Documented product, architectural, and business assumptions. |
| **[docs/CHANGELOG.md](docs/CHANGELOG.md)** | Detailed changelog of hardening and mobile redesign updates. |
| **[docs/VERIFICATION.md](docs/VERIFICATION.md)** | Verification records: Automated test outputs, build logs, route checks, and environment notes. |

---

## 🏛 Repository Structure

```
├── AGENTS.md                  # Quick reference for AI coding agents
├── context.md                 # Master context & architectural invariants for AI agents
├── README.md                  # Project overview, setup, and navigation
├── docs/                      # 21 comprehensive operational & technical documentation guides
├── prisma/
│   ├── schema.prisma          # Database schema with RankSnapshot, compound indexes, and relations
│   └── seed.ts                # Seeder (124 food stalls, 40 lifestyle stalls, 1800+ ratings, snapshots)
├── src/
│   ├── app/
│   │   ├── page.tsx           # Mobile-first festival landing page
│   │   ├── leaderboard/       # Live Top 10 rankings with truthful snapshot indicators
│   │   ├── vendors/           # Mobile stall directory & detail pages with rating breakdown
│   │   ├── vote/              # Mobile 5-step voting flow (0-star initial state, quota tracker)
│   │   ├── awards/            # Public awards ceremony portal
│   │   ├── kiosk/             # Venue exit touch kiosk wizard (future scope)
│   │   ├── admin/             # Organizer administration console
│   │   └── api/               # Hardened REST endpoints (admin guarded with requireAdmin)
│   ├── components/            # Mobile-optimized UI components (BottomNav, StarRating, etc.)
│   ├── lib/                   # Core domain engines (auth, voting, ranking, trending, anomaly)
│   └── tests/                 # Vitest test suites (24 tests passing)
```

---

## 🔒 Security & Invariants Checklist

- [x] All `/api/admin/*` routes strictly guarded with server-side `requireAdmin(req)`.
- [x] PBKDF2 password hashing with cryptographically secure random salt (100,000 iterations, SHA-512).
- [x] Production pass tokens anonymized (`ATT-••••-XXXX`) across admin logs and exports.
- [x] Client session ID never blindly trusted (HMAC-SHA256 cookie validation enforced).
- [x] 0-star initial rating state (no 5-star prefill; submit disabled until explicit rating).
- [x] Truthful rank movement from database `RankSnapshot` records (no synthetic simulators).
- [x] Truthful 30-minute velocity trending from database timestamps.
- [x] Maximum 5 food vendors per attendee per day strictly enforced.
- [x] Same-day duplicate vote updates existing rating without consuming extra quota.
- [x] Lifestyle vendors strictly excluded from food ratings and leaderboard.
- [x] `NEXT_PUBLIC_DEV_MODE=false` completely hides developer bar in production.

---

## 📄 License

Internal proprietary software for **Grand Food Fest Hyderabad 2026**. All rights reserved.
