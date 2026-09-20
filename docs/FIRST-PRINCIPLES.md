# Grand Food Fest — First-Principles Engineering & Architecture

> **Core Philosophy**: *"What must be true for this product to reliably work for 75,000+ real people outdoors at a live food festival?"*

---

## 1. The Physical Environment: Gachibowli Stadium, Hyderabad

Outdoor festival conditions dictate engineering decisions far more than ideal browser environments:

1. **One-Handed Mobile Use**:
   - Attendees walk, hold food or drinks in one hand, and interact with their phone with the other.
   - **Requirement**: All primary interactions must be within thumb reach (bottom navigation, large 48px touch targets). No complex modals or microscopic desktop-table layouts.

2. **Harsh Sunlight & Glare**:
   - Hyderabad October afternoon sun washes out low-contrast, low-opacity dark glassmorphism.
   - **Requirement**: High-contrast, clean light surfaces, deep stone/charcoal text, amber accents, bold typography.

3. **Intermittent / High-Latency Cellular Networks**:
   - 25,000 people per day in a single stadium creates cellular tower saturation. Requests experience packet drops, latency spikes, and reconnects.
   - **Requirement**: Client-side idempotency keys for all mutating requests (`Idempotency-Key` headers) to prevent double-counting upon retry. Zero dependency on continuous WebSocket streams; lightweight polling with resilient fallback.

4. **Crowds & Noise**:
   - Attendees have low attention spans. They want to check "What's good nearby?" or submit a quick rating in under 10 seconds.
   - **Requirement**: Zero onboarding friction, zero password forms for attendees, instant barcode/pass lookup, fast search by stall number or cuisine.

---

## 2. Voter Integrity & Business Invariants

A public food festival competition has intense vendor rivalry. Stalls compete for prestigious awards and bragging rights. Without rigorous controls, the system will be gamed.

### Invariant 1: Strictly Enforce 5 Food Vendors Per Attendee Per Event Day
- **Why**: Prevents ballot stuffing and spamming. An attendee realistically samples 3–5 food stalls per festival visit.
- **Enforcement**:
  - Enforced in a database transaction with row-level locking on the `AttendeeSession`.
  - Concurrent submissions cannot bypass the quota via race conditions.

### Invariant 2: Same-Day Rating Updates In-Place (Upsert)
- **Why**: If an attendee gives 4 stars, orders another dish at the same stall later, and wants to upgrade to 5 stars, they should be able to do so without consuming another slot of their 5-vendor daily quota.
- **Enforcement**: Relational composite unique constraint `@@unique([attendeeSessionId, vendorId, eventDayId])` and Prisma `upsert`.

### Invariant 3: Zero Attendee Session Spoofing
- **Why**: Attackers must not be able to submit votes by guessing or enumerating IDs.
- **Enforcement**:
  - Session identity is derived strictly from verified HMAC-SHA256 tokens (`gff_session` cookie).
  - Client-supplied `sessionId` in request bodies or headers is never trusted.

### Invariant 4: No Raw Pass Exposure & Strict Anonymity
- **Why**: If pass barcodes are leaked in admin dashboards, APIs, or database dumps, passes can be cloned. Furthermore, attendee anonymity preserves voting integrity.
- **Enforcement**:
  - Pass tokens are salted and hashed via SHA-256 (`passHash`).
  - Database persistence and UI display only store the masked identifier (`anonymizePassToken()` -> `ATT-••••-XXXX`).
  - Pass hashes are single-direction; attendee identities cannot be reverse-engineered.

### Invariant 5: Food-Only Leaderboard (Lifestyle Rejection)
- **Why**: Grand Food Fest features retail, fashion, and handicraft stalls ("Lifestyle"). Rating a lifestyle stall as food skews awards and confuses attendees.
- **Enforcement**:
  - Server-side rejection of ratings for any vendor where `vendorType !== "FOOD"`.
  - Lifestyle stalls are strictly excluded from Bayesian ranking aggregation.

### Invariant 6: No 5-Star Default (Explicit Rating Requirement)
- **Why**: Pre-filling 5 stars introduces heavy systematic positive bias.
- **Enforcement**: Unrated stalls initialize at 0 stars (`null`). The rating submission button remains disabled until every selected stall receives an explicit 1–5 star rating.

### Invariant 7: Truthful Rank Movement & Trending Analytics
- **Why**: Fake movement indicators (e.g. random `↑ 5` badges) mislead festivalgoers.
- **Enforcement**:
  - Rank movement is computed strictly against persistent `RankSnapshot` historical records (`↑ X`, `↓ Y`, `—`, `NEW`).
  - Trending metrics reflect actual ratings in a rolling 30-minute window, or are labeled honestly as recent festival reviews when the rolling window is quiet.

---

## 3. Mathematical Rigor: Bayesian Leaderboard Ranking

Raw arithmetic average ($\bar{R} = \frac{\sum r}{n}$) fails in open voting competitions:
- Stall A: 1 rating, 5 stars $\rightarrow$ Average = 5.0
- Stall B: 500 ratings, average = 4.8

A naive average ranks Stall A above Stall B, which is unfair.

The platform uses a Bayesian Weighted Average with Minimum Quorum:
$$S = \frac{v}{v + m} \cdot R + \frac{m}{v + m} \cdot C$$

Where:
- $v$: Number of valid ratings for the vendor ($n$)
- $m$: Minimum rating threshold required for confidence ($m = 20$)
- $R$: Vendor's raw arithmetic average rating
- $C$: Festival-wide global average rating across all food vendors (e.g. $4.0$)

### Properties:
1. **Low Volume Regression**: When $v$ is small, the score pulls strongly toward $C$.
2. **High Volume Convergence**: As $v \gg m$, $\frac{v}{v + m} \to 1$, and $S \to R$.
3. **Threshold Gate**: Vendors with $v < m$ are labeled as *Unranked / Ineligible* on the official Top 10 leaderboard until they achieve statistical confidence.
