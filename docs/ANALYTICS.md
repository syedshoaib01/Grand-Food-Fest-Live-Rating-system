# LIVE ANALYTICS & TELEMETRY — GRAND FOOD FEST

This document describes the real-time operational analytics and organizer reporting suite.

---

## 1. ORGANIZER TELEMETRY METRICS

Accessible to authorized festival administrators at `GET /api/admin/analytics`:

* **Active Attendees Today**: Distinct `AttendeeSession` count linked to current `eventDayId`.
* **Total Ratings Counted**: Total valid rating records today.
* **Hourly Velocity**: Number of ratings submitted in the last 60 minutes.
* **Festival Average**: Global arithmetic mean of all ratings submitted today.
* **Most Rated Stall**: Food vendor with highest total votes counted.
* **Fastest Rising Stall**: Top trending stall based on rolling 30-minute velocity.
* **Current #1 & #10 Stalls**: Edge anchors of the live Top 10 leaderboard.

---

## 2. ANOMALY DETECTION ENGINE

Automated scans identify potential coordinated voting or hardware malfunctions:
* **Velocity Spike**: >15 ratings cast for a single vendor within 5 minutes.
* **Monolithic Score Clusters**: >20 consecutive 5-star or 1-star ratings from sequential pass numbers.
* **Suspicious Records**: Logged in `AnomalyLog` with details and severity level.
* **Admin Controls**: Organizers can review anomaly entries and either dismiss them as benign crowd bursts or invalidate the affected rating batch. Invalidation preserves the audit trail without silently dropping data.

---

## 3. AUDIT TRAIL & PRIVACY

All administrative analytics and export screens protect attendee privacy:
* Complete ticket/wristband pass tokens are never exposed.
* Pass tokens are masked as `ATT-••••-XXXX`.
* Audit actions (e.g. invalidating ratings or updating festival status) log the operating admin's email and timestamp.
