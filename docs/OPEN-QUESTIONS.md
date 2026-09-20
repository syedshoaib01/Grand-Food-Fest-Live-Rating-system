# Grand Food Fest — Open Questions for Festival Organizers

The following technical and operational questions impact production governance, fair competition rules, and dispute resolution for Grand Food Fest Hyderabad (Oct 9–11, 2026).

---

## 1. Rating Update Time Window: All-Day vs. Restricted Window
- **Current Behavior**: An attendee can update their rating for a vendor at any point during that active event day until midnight.
- **Question**: Should an attendee be allowed to update their rating hours later (e.g. after leaving the stadium), or should rating edits only be permitted within 60–90 minutes of the initial rating?
- **Trade-off**:
  - *All-Day*: Accommodates attendees who order second servings later in the evening.
  - *Restricted Window*: Reduces post-event retaliation or coordinated late-night brigading.
- **Recommendation**: Retain all-day editing for V1, but flag rating updates with large star deltas ($\ge 3$ star change) in `AnomalyLog`.

---

## 2. Handling Mid-Day Vendor Closures and Pauses
- **Current Behavior**: If an organizer sets a vendor's status to `PAUSED` or `CLOSED` (e.g. ran out of stock, kitchen issue), `isEligibleForLeaderboard` drops to `false`, immediately hiding the stall from the Top 10.
- **Question**: If a vendor is temporarily paused for 45 minutes to prep ingredients, should they immediately disappear from the live leaderboard?
- **Recommendation**: Separate *operational status* (`acceptingRatings: boolean`) from *leaderboard eligibility* (`hasValidRatings: boolean`). A vendor that runs out of food should stop accepting new ratings, but legitimate earlier votes should remain visible.

---

## 3. Award Winner Calculation: Multi-Day Cumulative vs. Day-by-Day
- **Current Behavior**: The system calculates awards across all valid ratings associated with the event.
- **Question**: Are category awards (e.g. "Best Biryani of Hyderabad 2026") decided by cumulative scores across all 3 days, or are there daily awards?
- **Recommendation**:
  - Primary category trophies: 3-day cumulative Bayesian score.
  - Daily highlights: "Day 1 People's Choice", "Day 2 People's Choice", "Day 3 People's Choice".

---

## 4. Manual Overrides on Awards
- **Current Behavior**: Admins can announce winners directly through `/admin/awards`.
- **Question**: Should the admin panel allow picking a winner who is NOT the #1 ranked nominee, and if so, what audit trail is required?
- **Recommendation**: Require an explicit `justification` string field whenever an admin selects a winner who differs from the mathematical #1 rank. Log this in `AdminAuditLog`.

---

## 5. Event Finalization Freeze Mechanics
- **Current Behavior**: Updating Event status to `FINALIZED` marks event days as `CLOSED` and closes active voting ingestion.
- **Question**: When finalization is clicked:
  1. Does public voting immediately reject incoming requests with a graceful banner ("Festival voting has concluded!")?
  2. Does the live leaderboard permanently freeze in its final state?
- **Recommendation**: Confirmed. When `FINALIZED`, all endpoints return a celebratory finalized state, and rankings become static read-only historical records.

---

## 6. Invalidated Ratings and Daily Attendee Quota
- **Current Behavior**: If an admin invalidates a vendor's fraudulent votes via `/api/admin/anomalies`, `Rating.isValid` is set to `false`. However, the attendee's daily quota check queries `tx.rating.findMany({ where: { isValid: true } })`.
- **Question**: If an innocent attendee's vote is invalidated due to a blanket stall anomaly purge, should that attendee get their quota slot refunded so they can rate another stall?
- **Recommendation**: Yes. By checking only `isValid: true` ratings against the 5-vendor limit, the quota slot is automatically freed for the attendee.

---

## 7. Tie-Breaking Policies for Final Awards
- **Current Behavior**: When two vendors have identical Bayesian scores, the ranking engine breaks ties using:
  1. Total Rating Count ($v$) descending.
  2. Raw Arithmetic Average ($R$) descending.
- **Question**: Is this tie-breaking hierarchy acceptable to the executive organizers, or should ties result in joint co-winners?
- **Recommendation**: The dual tie-breaker (volume first, then average) is mathematically sound and fair. Recommend keeping this policy.

---

## 8. Rollback and Disaster Recovery Policy
- **Question**: What is the protocol if an admin accidentally clicks "Finalize Festival" early on Day 2?
- **Recommendation**: Maintain a restricted admin emergency rollback endpoint `/api/admin/emergency/reopen` that requires dual confirmation or master password entry to re-open closed event days.
