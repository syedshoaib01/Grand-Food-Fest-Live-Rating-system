# Architecture & System Design — Grand Food Fest Live Rating Platform

## 1. Overview
The Grand Food Fest Live Food Rating Platform is an event-specific real-time aggregation and rating platform designed for high-concurrency food festivals (such as Grand Food Fest Hyderabad at Gachibowli Stadium, projected attendance 75,000+ attendees over 3 event days).

Unlike generic restaurant review products (e.g. Yelp, Zomato), the platform is optimized for **fast throughput**, **near-zero attendee friction**, **multi-day quota enforcement**, and **confidence-adjusted real-time leaderboard generation**.

```
Attendee Journey:
Attend Event → Try Food → Scan Pass / QR → Select Up to 5 Vendors → Rate 1-5 Stars → Submit → Instant Leaderboard Feedback

Organizer Journey:
Configure Festival → Manage Stalls → Live Telemetry Stream → Anomaly Investigation → Freeze Leaderboard → Declare Awards & Export
```

---

## 2. Core Architectural Components

### A. Next.js App Router (Full-Stack TypeScript)
- **Edge-Ready & Node.js Server Routes**: Clean REST API handlers in `src/app/api/` handle voting, leaderboard, trending, admin operations, and data exports.
- **Client & Server Separation**: All critical business rules (quota checks, same-day upsert logic, active status, threshold validation, and Bayesian score calculations) are strictly executed on the server.
- **Dual Voting Surfaces**:
  - **Mobile Web (`/vote`)**: Thumb-friendly layout designed for quick rating while walking around food stalls.
  - **Venue Exit Touch Kiosk (`/kiosk`)**: Fullscreen, high-contrast touch wizard with large tap targets and automatic 12-second inactivity reset for high-traffic physical kiosks.

### B. Core Domain Engines (`src/lib/`)
1. **`VotingEngine` (`src/lib/voting-engine.ts`)**:
   - Manages attendee sessions tied to event days.
   - Enforces the strict rule: `One attendee + One vendor + One event day = One active rating`.
   - Executes atomic transactions via Prisma: guarantees an attendee never rates more than 5 distinct food vendors per day.
   - Supports batch rating submissions and idempotency keys to prevent duplicate requests on unreliable mobile festival networks.
2. **`RankingEngine` (`src/lib/ranking-engine.ts`)**:
   - Calculates confidence-adjusted Bayesian ranking scores:
     $$\text{Score} = \frac{v}{v + m} \cdot R + \frac{m}{v + m} \cdot C$$
     where $v$ is vendor rating count, $m$ is the threshold weight (default: 20), $R$ is vendor raw average, and $C$ is global festival average.
   - Handles ties consistently without arbitrary tie-breaking.
   - Enforces leaderboard eligibility: vendors with $v < m$ still display their raw average on their profile, but are excluded from the official Top 10.
3. **`TrendingEngine` (`src/lib/trending-engine.ts`)**:
   - Computes rolling 30–60 minute velocity and momentum jumps (e.g. `↑ 7 positions`) to surface surging stalls in real time.
4. **`AnomalyEngine` (`src/lib/anomaly-engine.ts`)**:
   - Detects abnormal velocity spikes (e.g. $>15$ ratings in 10 minutes) and logs potential fraud flags with complete audit trails.
   - Allows administrators to invalidate suspicious rating batches with one click without destroying historical logs.

### C. Database & Relational Schema
- **Relational Integrity**: Uses Prisma ORM with composite unique constraints `(attendeeSessionId, vendorId, eventDayId)` and indexes on `eventId`, `eventDayId`, `vendorId`, `isValid`, and `createdAt`.
- **Zero-Dependency Local Dev**: Built with SQLite for instant local execution, fully compatible with PostgreSQL and Supabase for production scale.

---

## 3. Voter Identification & Anonymity Model
- No email, phone number, password, OTP, or PII is requested or stored.
- Event wristband or ticket codes (e.g. `PASS-000123`) are salted and hashed using SHA-256 (`passHash`).
- The hash is tied to the active `eventDayId`, creating an ephemeral attendee session.
- An HMAC-signed cookie (`gff_session`) preserves attendee state across page loads.

---

## 4. Scaling Considerations for 100,000+ Attendees
1. **Leaderboard Cache-Control**:
   `/api/leaderboard` is configured with `s-maxage=15, stale-while-revalidate=30`, allowing CDN / edge edge caching so thousands of simultaneous screen displays and mobile attendees do not hammer the database.
2. **Database Read/Write Separation**:
   Ratings are inserted atomically. Leaderboard aggregations can run against read replicas in production PostgreSQL.
3. **Idempotency Keys**:
   Clients submit a unique UUID idempotency key on each rating request. If packet loss causes a mobile retry, the server recognizes the key and avoids duplicate processing.
