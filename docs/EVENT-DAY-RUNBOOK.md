# EVENT-DAY RUNBOOK — GRAND FOOD FEST HYDERABAD

This step-by-step operational runbook guides the tech and event operations team through all 3 days of Grand Food Fest (October 9–11, 2026).

---

## 1. PRE-EVENT CHECKLIST (T-24 HOURS)

* [ ] Verify database connection (`DATABASE_URL`) has sufficient connection pool limit.
* [ ] Verify `NEXT_PUBLIC_DEV_MODE="false"` in production environment.
* [ ] Confirm admin accounts are seeded with strong credentials.
* [ ] Ensure all 160+ participating stalls have correct stall numbers and categories.
* [ ] Verify Event status is `LIVE` and Day 1 status is `LIVE`.
* [ ] Run `curl https://<domain>/api/leaderboard` to verify healthy API response.

---

## 2. DAY 1 EXECUTION (FRIDAY, OCT 9)

* **14:00 (Gates Open)**: Monitor `/admin` dashboard as first attendees enter and verify wristband tokens.
* **17:00 (Evening Rush)**: Check `/admin/anomalies` hourly for velocity alerts.
* **23:00 (Nightly Snapshot)**:
  * Trigger snapshot via admin console or `POST /api/admin/snapshot`.
  * Export Day 1 CSV summary from `/admin/exports`.
* **01:00 (Closing Day 1)**:
  * In `/admin/settings`, set Day 1 status to `CLOSED`.
  * Set Day 2 status to `LIVE`.
  * Attendee quotas automatically reset for Day 2!

---

## 3. DAY 2 & DAY 3 EXECUTION

* Repeat daily cycle.
* **Sunday 21:00 (Awards Ceremony)**:
  * In `/admin/awards`, announce official winners for each category.
  * Winners appear immediately on the public `/awards` page.
* **Sunday 23:59 (Festival Finalization)**:
  * In `/admin/settings`, set Event status to `FINALIZED`.
  * Public leaderboard freezes; all incoming votes are rejected.
  * Download final official CSV and JSON exports for festival archives.
