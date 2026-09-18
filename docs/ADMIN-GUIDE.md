# ADMIN GUIDE — GRAND FOOD FEST

This guide instructs festival operations teams on managing the Grand Food Fest console.

---

## 1. ACCESS & CREDENTIALS

* **URL**: `/admin/login`
* **Security**: Enforces server-side authentication (`requireAdmin`).
* **Credentials**: Use configured credentials from environment variables or database `AdminUser` record.
* **Session**: Issues a 24-hour secure HTTP-only cookie (`gff_admin`).

---

## 2. DASHBOARD SECTIONS

### Overview (`/admin`)
* Real-time metrics: active attendees, hourly rating velocity, top contenders.
* High-level festival status badge (`LIVE`, `FINALIZED`).

### Vendor Management (`/admin/vendors`)
* Filter stalls by zone, category, or status (`ACTIVE`, `PAUSED`, `CLOSED`).
* Add new stalls or edit vendor metadata (stall number, cuisine, description).
* Pause stalls temporarily if ingredients run out.

### Rating Audit (`/admin/ratings`)
* Real-time stream of incoming votes.
* Filter by stall, event day, or star rating.
* Toggle `isValid` on individual ratings if manually disputed.
* Attendee identifiers appear masked (`ATT-••••-XXXX`) for privacy.

### Anomaly Engine (`/admin/anomalies`)
* Review automated alerts for abnormal velocity bursts.
* Action `INVALIDATE_RECENT_RATINGS` marks suspicious votes invalid.
* Action `DISMISS_ANOMALY` logs the anomaly as benign crowd activity.

### Awards Ceremony (`/admin/awards`)
* Create custom festival awards (e.g. "Best Biryani of Hyderabad 2026").
* Assign vendor nominees.
* Reveal nominees or announce the final winner.

### Data Exports (`/admin/exports`)
* Export reports in **CSV** or **JSON**:
  * `leaderboard`: Full ranked list with scores, counts, and movements.
  * `vendors`: Master directory with total ratings and raw averages.
  * `ratings`: Transactional records with timestamps and anonymized attendee IDs.
  * `summary`: Festival-wide totals for press releases and organizers.
