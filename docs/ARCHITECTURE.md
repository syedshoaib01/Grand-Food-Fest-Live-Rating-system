# ARCHITECTURE SPECIFICATION — GRAND FOOD FEST

This document describes the technical architecture, component boundaries, and data flow of the Grand Food Fest Live Rating Platform.

---

## 1. SYSTEM OVERVIEW

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (Mobile First)                     │
│  - React 18 + Next.js 14 App Router                                     │
│  - Inter Google Typography + Tailwind CSS (Warm Festival Palette)      │
│  - Responsive Bottom Navigation (Top 10, Explore, Rate, Awards)        │
│  - Client SessionContext (HMAC Cookie `gff_session` sync)              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS (JSON / REST)
┌───────────────────────────────────▼────────────────────────────────────┐
│                        API & SECURITY LAYER                            │
│  - Next.js Route Handlers                                              │
│  - requireAdmin() Server Gate (401 unauthenticated, 403 unauthorized)  │
│  - HMAC Token Signer & Verifier (SHA-256)                              │
│  - Pass Token Anonymizer (ATT-••••-XXXX)                               │
│  - PBKDF2 Salted Password Verifier                                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                        DOMAIN ENGINE LAYER                             │
│  - Voting Engine: Quota validation, atomic rating upserts              │
│  - Ranking Engine: Bayesian scoring, tie handling, RankSnapshots       │
│  - Trending Engine: Rolling 30-minute velocity & activity aggregation  │
│  - Anomaly Engine: Spike detection & invalidation audit logs           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                        PERSISTENCE LAYER (Prisma ORM)                  │
│  - Development: SQLite (dev.db)                                        │
│  - Production: PostgreSQL / Supabase                                   │
│  - Models: Event, EventDay, Vendor, AttendeeSession, Rating,           │
│            RankSnapshot, Award, AwardNominee, AnomalyLog, AdminUser    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. COMPONENT RESPONSIBILITIES

### `src/lib/auth.ts`
* Cryptographic signing and verification of attendee sessions and admin tokens using HMAC-SHA256.
* Salted password hashing and verification using PBKDF2 (`hashPassword` / `verifyPassword`).
* Reusable server-side route gate `requireAdmin(req: NextRequest)` returning 401/403.
* Attendee privacy mask `anonymizePassToken(token)` converting `PASS-000123` into `ATT-••••-0123`.

### `src/lib/voting-engine.ts`
* Pass code normalization and validation (`^[A-Z0-9_-]{4,32}$`).
* Anonymous attendee session retrieval / upsert by `(passHash, eventDayId)`.
* Server-side quota checking (5 vendors/day limit).
* Atomic transactions ensuring duplicate submissions on the same day update existing ratings instead of consuming new slots.

### `src/lib/ranking-engine.ts`
* Computes festival-wide global average $C$.
* Calculates confidence-adjusted Bayesian ranking scores:
  $$S = \left(\frac{v}{v + m}\right) R + \left(\frac{m}{v + m}\right) C$$
* Queries the latest `RankSnapshot` batch to compute truthful rank change ($diff = prevRank - currentRank$).
* Formats movement as `↑ X`, `↓ Y`, `—`, or `NEW`.
* Persists historical snapshots via `createRankSnapshot(eventId)`.

### `src/lib/trending-engine.ts`
* Pulls valid ratings for food stalls created in the last 30 minutes.
* Aggregates recent rating count and recent average rating.
* Generates truthful labels: `+X ratings in 30 min` and `surgeReason`.

### `src/lib/anomaly-engine.ts`
* Scans rating logs for abnormal bursts (e.g. >10 ratings in 5 minutes).
* Records audit entries in `AnomalyLog`.
* Provides admin tools to invalidate suspicious rating batches while maintaining full auditability.

---

## 3. PRODUCTION SCALING CONSIDERATIONS

* **Database Scalability**: Designed for 100,000+ attendee sessions and 200,000+ ratings.
* **Query Optimization**: Multi-column composite unique constraints on `(attendeeSessionId, vendorId, eventDayId)` prevent duplicate rows and provide $O(1)$ lookups.
* **Caching & Snapshots**: Rather than recalculating Bayesian scores across hundreds of thousands of rows on every page view, `RankSnapshot` records periodically capture leaderboard states for instant retrieval.
