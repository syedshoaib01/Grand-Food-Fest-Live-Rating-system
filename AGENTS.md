# AGENTS.md — AI CODING AGENT QUICK REFERENCE

> **Read `context.md` first before touching this repository.**  
> This file is a quick-reference guide for AI agents working in this codebase.

---

## 1. PRIMARY DIRECTIVE: MOBILE-FIRST CONSUMER EXPERIENCE

The primary consumer experience is **smartphones at the festival**.
* Attendees are outdoors at Gachibowli Stadium, walking, holding food in one hand.
* Design and test for: 360×800 to 430×932 viewports.
* Thumb-friendly touch targets (min 44×44px).
* Bottom navigation bar (`Top 10`, `Explore`, `Rate`, `Awards`).
* Do NOT treat mobile as a shrunken desktop.
* Kiosk (`/kiosk`) is explicitly deferred future scope; do not spend effort redesigning kiosk UI or let it warp consumer mobile UX.

---

## 2. NON-NEGOTIABLE BUSINESS INVARIANTS

Future agents must NEVER break these invariants:

1. **Max 5 Stalls/Day**: Never allow >5 distinct food vendors per attendee session per event day. Enforced strictly server-side.
2. **Same-Day Resubmission**: Rating the same stall again on the same day updates the existing rating in-place; it must NOT consume another vendor quota slot.
3. **Multi-Day Reset**: Each event day gives attendees a fresh 5-vendor quota.
4. **Food-Only Leaderboard**: Lifestyle vendors (`vendorType: LIFESTYLE`) must NEVER receive food ratings or appear on the leaderboard.
5. **No 5-Star Default**: Newly selected unrated stalls must initialize to **0 stars** (`no rating selected`). Submission must remain disabled until every selected stall has an explicit 1–5 rating.
6. **Zero Session Spoofing**: Never trust client-provided `sessionId` in request bodies or headers. Session identity is strictly derived from the verified `gff_session` HMAC cookie.
7. **No Raw Pass Exposure**: Production attendee pass tokens must NEVER be exposed in UI, admin views, or exports (`anonymizePassToken()` -> `ATT-••••-XXXX`).
8. **Truthful Rank Movement**: Never simulate fake rank movement (`↑ 7 positions`). Rank movement must come from `RankSnapshot` comparisons (`↑ X`, `↓ Y`, `—`, `NEW`).
9. **Truthful Trending**: Trending metrics must reflect actual ratings in a rolling 30-minute window (`+X ratings in 30 min`), never synthetic positions.
10. **Protected Admin APIs**: Every `/api/admin/*` endpoint must enforce `requireAdmin(req)`. Passwords use salted PBKDF2.

---

## 3. KEY COMMANDS

```bash
# Development server
npm run dev

# Run Vitest test suite
npm test

# Typecheck and production bundle build
npm run build

# Push schema changes to database
npx prisma db push

# Seed 160+ vendors, 400 sessions, and RankSnapshots
npm run db:seed
```

---

## 4. DANGEROUS FILES / SENSITIVE AREAS

* `src/lib/voting-engine.ts`: Core quota transactions, deduplication, and atomic upsert logic.
* `src/lib/auth.ts`: Password hashing, session verification, `requireAdmin()` gate, pass token anonymization.
* `src/lib/ranking-engine.ts`: Bayesian scoring and `RankSnapshot` movement tracking.
* `src/app/api/voting/ratings/route.ts`: Public voting ingestion point; must enforce session authenticity and explicit star validation.
* `src/app/api/admin/*`: Must all remain protected by `requireAdmin(req)`.
* `prisma/schema.prisma`: Do not alter `@unique` constraints without verifying database index performance.

---

## 5. TESTING & DOCUMENTATION EXPECTATIONS

* Run `npm test` after any change to domain logic or route handlers.
* Run `npm run build` after major updates to ensure zero compile or TypeScript errors.
* Maintain all 21 documentation files in `docs/` and `context.md`. Never document features as implemented if they are only planned.
