# CHANGELOG — GRAND FOOD FEST V1 HARDENING

All notable changes in this iteration are documented in this file.

---

## [V1.1.0] — V1 Hardening, Mobile-First Redesign & Truthful Analytics

### 1. Security Hardening
* **Server-Side Admin Gate**: Created `requireAdmin(req: NextRequest)` and enforced it across all `/api/admin/*` endpoints (`analytics`, `settings`, `ratings`, `anomalies`, `awards`, `exports`, `POST /api/vendors`, `PUT/PATCH /api/vendors/[id]`).
* **Salted Password Verification**: Replaced plaintext password comparisons and hardcoded `admin123` with PBKDF2 salted hashing (16-byte random salt, 100,000 iterations, SHA-512).
* **Session Trust Enforcement**: Removed arbitrary client-provided `sessionId` and `x-session-id` acceptance in `/api/voting/ratings` and `/api/voting/session`. Attendee identity is strictly derived from cryptographically verified `gff_session` HMAC cookies.
* **Attendee Privacy Protection**: Implemented `anonymizePassToken()` to mask pass tokens as `ATT-••••-XXXX` across admin tables and data exports.
* **Production Secret Sanitation**: Updated `.env.example` with secure placeholders and removed pre-filled credentials from `/admin/login`.

### 2. Rating & Business Logic Corrections
* **5-Star Default Bug Fixed**: Newly selected unrated food stalls now initialize to **0 stars** (`no rating selected`). Submission is strictly disabled until every selected stall receives an explicit 1–5 rating. Existing same-day ratings are loaded for easy adjustment.
* **Truthful Rank Movement**: Removed synthetic trend velocity jumps (`↑ 7 positions`). Added `RankSnapshot` model to record periodic historical rank snapshots. Rankings now truthfully display `↑ X`, `↓ Y`, `—`, or `NEW`.
* **Truthful Trending Engine**: Switched trending rolling window to 30 minutes, calculating truthful rating volume and averages (`+X ratings in 30 min • avg Y★`).

### 3. Mobile-First Redesign & UX
* **Warm Festival Visual Language**: Replaced dark glassmorphism with a warm festival design system: cream background (`#FAF8F5`), white surfaces (`#FFFFFF`), charcoal text (`#1C1917`), saffron/amber accents (`#D97706` / `#F59E0B`), warm orange (`#EA580C`).
* **Inter Typography**: Integrated Google Inter via `next/font/google`.
* **Bottom Navigation**: Created `BottomNav.tsx` providing quick thumb navigation (`Top 10`, `Explore`, `Rate`, `Awards`).
* **Homepage Hierarchy**: Redesigned homepage around the primary CTA `[ Rate Food ]` and secondary `[ See Top 10 ]`.
* **Public Language Polish**: Replaced mathematical jargon ("Bayesian confidence score") with consumer-friendly language ("Live ranking based on attendee ratings").
* **Public Awards API**: Created `GET /api/awards` for unauthenticated attendee viewing of revealed nominees and announced winners.

### 4. Testing & Handover Documentation
* **Comprehensive Test Suite**: Added `src/tests/hardening-and-security.test.ts` covering password hashing, `requireAdmin()` 401/403 status codes, pass anonymization, closed day rejection, and `RankSnapshot` movement. Total 24 automated tests passing with zero failures.
* **AI Agent Handover Suite**: Created root `context.md` and `AGENTS.md` to ensure future AI agents preserve all business invariants and architecture patterns.
* **Complete Documentation Suite**: Created 21 technical and operational guides in `docs/`.
