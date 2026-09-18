# Festival Organizer's Guide — Grand Food Fest Hyderabad 2026

Welcome to the Organizer Operations Manual for the Grand Food Fest Live Rating Platform. This guide outlines how festival coordinators, track leads, and data administrators can operate the platform before, during, and after the event.

---

## 1. Accessing the Admin Console
- URL: `https://your-domain.com/admin` (or `http://localhost:3000/admin` locally)
- Default credentials for local development:
  - **Email**: `admin@grandfoodfest.com`
  - **Password**: `admin123`

---

## 2. Pre-Festival Setup Checklist
1. **Verify Vendors & Stalls**:
   - Go to **Vendor Management** (`/admin/vendors`).
   - Check that all ~110 food stalls have correct stall codes (e.g. `A-01` to `A-50`), categories, and cuisines.
   - If a vendor changes menu or withdraws, update their status to `PAUSED` or `WITHDRAWN`.
2. **Configure Award Honors**:
   - Go to **Awards Center** (`/admin/awards`).
   - Create desired award categories (e.g. "Best Biryani of Hyderabad 2026", "Most Loved Dessert").
   - Assign initial nominated stalls.
3. **Verify Event Days**:
   - Go to **Event Settings** (`/admin/settings`).
   - Confirm Day 1 (Oct 9), Day 2 (Oct 10), and Day 3 (Oct 11) are present.
   - Set Day 1 status to `LIVE` before gates open at 3:00 PM.

---

## 3. Operations During Festival Hours (3:00 PM – 1:00 AM)

### A. Monitoring Live Telemetry
- The **Live Overview** (`/admin`) updates automatically every 15 seconds.
- Monitor total verified attendee sessions, ratings per hour, current #1 stall, and fastest rising stalls.

### B. Investigating Potential Anomalies
- The **Anomaly Flags** (`/admin/anomalies`) tab automatically flags abnormal rating spikes (e.g. $>15$ ratings in 10 minutes on a stall).
- If an anomaly is identified as fraudulent (e.g. a vendor attempting to self-vote in a rapid burst):
  - Click **Invalidate Suspicious Ratings**.
  - The system invalidates those records from the leaderboard while preserving full audit logs.
- If an anomaly is natural (e.g. sudden surge after an onstage chef showcase):
  - Click **Dismiss as Benign**.

### C. Kiosk Stations at Venue Exits
- Open `/kiosk` on touchscreen tablets or iPad stands positioned near venue exits.
- The interface is full-screen, high-contrast, and auto-resets after 12 seconds so attendees leaving the stadium can quickly submit their votes.

---

## 4. End-of-Day & Multi-Day Rollover

### At 1:00 AM (End of Day 1):
1. Navigate to **Event Settings** (`/admin/settings`).
2. Select **Day 2 (Oct 10)** as the active day.
3. The platform instantly rolls over:
   - Attendees receive a fresh quota of 5 ratings for Day 2.
   - Day 1 historical ratings remain permanently preserved.

---

## 5. Final Result Freeze & Awards Ceremony (Night of Oct 11)

1. **Freeze the Leaderboard**:
   - In **Event Settings**, change Festival Status from `LIVE` to `FINALIZED`.
   - Public rankings immediately freeze and no further ratings are accepted.
2. **Declare Award Winners**:
   - In **Awards Center** (`/admin/awards`), select the winner for each category and set status to `WINNER_ANNOUNCED`.
   - The public `/awards` page will reveal the winner with celebratory crown badges.
3. **Export Reports**:
   - Go to **Data Exports** (`/admin/exports`).
   - Download the official Leaderboard, Vendor Statistics, and Raw Ratings in CSV or JSON format for official record-keeping and sponsor debriefs.
