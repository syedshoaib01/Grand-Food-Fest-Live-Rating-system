# USER FLOWS — GRAND FOOD FEST

This document outlines the end-to-end user journeys for festival attendees and festival organizers.

---

## 1. CONSUMER FLOW: ATTENDEE RATING EXPERIENCE

```text
[ Attendee on Mobile ]
        ↓
1. Opens Homepage (/)
   - Sees "🔥 What’s winning right now?"
   - Views primary CTA [ Rate Food ] and secondary [ See Top 10 ]
   - Sees Live Trending stalls (+X ratings in 30 min)
        ↓
2. Clicks [ Rate Food ] (/vote)
   - Step 1: Voter Identification (Wristband / Pass token e.g. PASS-000001)
   - Server cryptographically verifies token and sets `gff_session` HTTP-only cookie
        ↓
3. Search & Select Stalls
   - App displays: "You have 5 ratings left today"
   - Attendee searches stalls by name, stall number (e.g. A-12), or cuisine
   - Clicks "+ Add" to add up to 5 stalls
        ↓
4. Explicit Star Rating
   - Newly selected stalls start at 0 stars ("☆ ☆ ☆ ☆ ☆ • No rating selected")
   - Attendee taps 1 to 5 stars (e.g. 5 • Excellent!)
   - Submit button remains disabled until every selected stall has 1–5 stars
        ↓
5. Submit Ratings
   - Atomic database transaction validates quota, upserts ratings, and checks festival status
   - Success screen displays:
     "✓ Thanks for rating!"
     "Your ratings are counted."
     "You have X ratings left today."
     [ See live rankings ]
        ↓
6. Live Leaderboard Exploration (/leaderboard)
   - Attendee watches real-time rankings and truthful movements (↑ 2, ↓ 1, —, NEW)
```

---

## 2. CONSUMER FLOW: STALL EXPLORATION & DIRECT RATING

```text
[ Attendee browsing Directory ]
        ↓
1. Opens Explore (/vendors)
   - Filters by Food vs. Lifestyle
   - Taps category pills (Biryani, Kebabs, Desserts, Chaat)
   - Searches by stall number (e.g. A-01)
        ↓
2. Views Stall Detail (/vendors/[slug])
   - Sees Stall Name, Zone, Stall Number, Cuisine
   - Sees Live Rating (⭐ 4.82 from 642 ratings)
   - Sees Rank (#1 right now)
   - Views Rating Distribution bar chart (5★ to 1★)
        ↓
3. Taps [ Rate this stall ]
   - If authenticated: records rating directly with instant confirmation
   - If unauthenticated: redirects to `/vote?vendorId=...` with stall preselected
```

---

## 3. ORGANIZER FLOW: ADMINISTRATIVE CONTROL & TELEMETRY

```text
[ Festival Organizer / Admin ]
        ↓
1. Enters Admin Portal (/admin/login)
   - Enters configured admin email & password
   - Server verifies salted PBKDF2 password hash
   - Issues signed `gff_admin` cookie
        ↓
2. Operations Dashboard (/admin)
   - Real-time rating velocity, attendee sessions, active stalls
   - Fast rising stalls and top contenders
        ↓
3. Anomaly Review (/admin/anomalies)
   - Automated scans detect rating spikes (e.g. 45 ratings in 5 minutes)
   - Admin reviews audit trail and can dismiss or invalidate suspicious batches
        ↓
4. Awards Finalization (/admin/awards)
   - Reviews nominees across festival categories
   - Selects winners and updates award status to "WINNER_ANNOUNCED"
        ↓
5. Festival Exports (/admin/exports)
   - Downloads CSV or JSON reports for leaderboard, stalls, and ratings
   - All attendee passes are anonymized (ATT-••••-XXXX) for privacy
```
