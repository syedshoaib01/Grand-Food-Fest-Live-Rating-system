# VOTING RULES SPECIFICATION — GRAND FOOD FEST

This document details all business rules, database constraints, and validation logic governing food ratings.

---

## 1. CORE VOTING INVARIANTS

### Invariant 1: 1 to 5 Stars
* Ratings must be integer values between 1 and 5 (`1 <= rating <= 5`).
* Ratings outside this range are rejected with `400 Bad Request`.
* Descriptive labels:
  * `1` — Poor
  * `2` — Fair
  * `3` — Good
  * `4` — Very Good
  * `5` — Excellent!
* **No Default Rating**: Newly selected stalls initialize to **0 stars** (`no rating selected`). Submission is disabled until every selected stall has an explicit 1–5 rating.

### Invariant 2: Maximum 5 Stalls Per Day
* An attendee session may rate a maximum of **5 distinct food vendors** per festival event day.
* Once 5 distinct stalls have been rated, attempting to add a 6th stall is rejected with:
  `"You have reached today's 5-vendor rating limit."`

### Invariant 3: Same-Day Resubmission (Upsert)
* If an attendee rates a stall they previously rated on the same day, the existing rating record is updated with the new star score.
* The rating count does NOT increment; the remaining quota is NOT consumed.
* Enforced by database unique constraint:
  `@@unique([attendeeSessionId, vendorId, eventDayId])`

### Invariant 4: Multi-Day Reset
* When a new festival day begins (Day 1 -> Day 2 -> Day 3), the attendee's quota resets to 5 available stalls.
* Attendee sessions are scoped per day:
  `@@unique([passHash, eventDayId])`
* Attendees may rate the same vendor again on Day 2 as a separate daily vote.

### Invariant 5: Food Vendors Only
* Only stalls with `vendorType === "FOOD"` and `status === "ACTIVE"` may receive ratings.
* Lifestyle stalls (`vendorType === "LIFESTYLE"`) and paused/closed stalls are rejected.

### Invariant 6: Event Status Enforcement
* When the active event day status is `CLOSED` or the festival status is `FINALIZED`, all incoming votes are rejected with:
  `"Voting is closed for today."`
