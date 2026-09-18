# RANKING ENGINE SPECIFICATION — GRAND FOOD FEST

This document details the scoring algorithm, Bayesian confidence adjustment, tie handling, and historical rank snapshot mechanics.

---

## 1. THE BAYESIAN SCORING FORMULA

To prevent stalls with small sample sizes (e.g. 5 votes of 5.0) from unfairly dominating stalls with hundreds of authentic votes (e.g. 600 votes of 4.85), the platform employs a **confidence-adjusted Bayesian ranking formula**:

$$S = \left(\frac{v}{v + m}\right) R + \left(\frac{m}{v + m}\right) C$$

Where:
* $S$: Final confidence-adjusted ranking score (rounded to 4 decimal places).
* $v$: Number of valid ratings for this food stall (`ratingCount`).
* $m$: Minimum rating threshold required for confidence (configured per event, default: **20**).
* $R$: Raw arithmetic average rating for this food stall:
  $$R = \frac{\sum \text{ratings}}{v}$$
* $C$: Festival-wide global average across all participating food stalls:
  $$C = \frac{\sum_{\text{all}} \text{ratings}}{\sum_{\text{all}} \text{votes}} \quad (\text{fallback: } 4.0)$$

### Mathematical Intuition:
* When $v \ll m$ (low volume), $\frac{m}{v + m} \to 1$, pulling the vendor's score toward the festival average $C$.
* When $v \gg m$ (high volume), $\frac{v}{v + m} \to 1$, allowing the vendor's true performance $R$ to dominate.

---

## 2. OFFICIAL TOP 10 ELIGIBILITY THRESHOLD

* **Threshold**: Stalls must have **at least 20 verified ratings** ($v \ge 20$) and status `ACTIVE` to be eligible for the official Top 10 leaderboard.
* Stalls with fewer than 20 ratings remain in the full directory but display an eligibility status:
  `Needs X more votes to qualify for Top 10`

---

## 3. TIE-BREAKING MECHANISM

When two or more vendors have identical Bayesian scores:
1. **Primary sort**: `rankingScore` descending.
2. **Secondary tie-breaker**: `ratingCount` descending (vendor with more votes ranks higher).
3. **Tertiary tie-breaker**: `ratingAverage` descending.
4. If all three metrics are identical: Vendors are assigned identical ranks (e.g., both Rank 4), marked with `isTied: true`, and the next vendor takes Rank 6.

---

## 4. TRUTHFUL RANK MOVEMENT & SNAPSHOTS

The platform never fabricates synthetic trend jumps. Rank movement is derived from historical snapshots persisted in the `RankSnapshot` model.

```typescript
// Look up previous snapshot
const prevRank = previousRankMap[vendorId];
const rankChange = prevRank - currentRank;

if (rankChange > 0) {
  trendFormatted = `↑ ${rankChange}`; // Climbed X spots
} else if (rankChange < 0) {
  trendFormatted = `↓ ${Math.abs(rankChange)}`; // Dropped Y spots
} else if (hasPreviousRecord) {
  trendFormatted = "—"; // Unchanged
} else {
  trendFormatted = "NEW"; // Newly entered leaderboard
}
```
